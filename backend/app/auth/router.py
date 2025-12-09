import datetime as dt
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status

import app.auth.auth as auth_service
from app.auth import repository
from app.auth.dependencies import get_auth_user
from app.auth.models import User
from app.auth.schemas import (
    ChangePassword,
    RevokedSessionsResponse,
    SessionInfo,
    SessionListResponse,
    UserCredentials,
    UserPublic,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


def _get_client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


@router.post("/register")
async def register(request: Request, response: Response, user: UserCredentials):
    new_user = await auth_service.check_and_create_user(user.username, user.password)

    user_agent = request.headers.get("User-Agent")
    ip_address = _get_client_ip(request)

    session_id = await auth_service.create_session(new_user, user_agent, ip_address)
    response.set_cookie(
        key="Authorization",
        value=session_id,
        expires=dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=365),
    )
    return {"username": user.username}


@router.post("/login")
async def session_login(request: Request, response: Response, user: UserCredentials):
    user_agent = request.headers.get("User-Agent")
    ip_address = _get_client_ip(request)

    session_id = await auth_service.login(
        user.username, user.password, user_agent, ip_address
    )
    response.set_cookie(
        key="Authorization",
        value=session_id,
        expires=dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=365),
    )
    return {"username": user.username}


@router.post("/logout")
async def session_logout(request: Request, response: Response):
    session_id = request.cookies.get("Authorization")
    if session_id:
        await auth_service.delete_session(UUID(session_id))
    response.delete_cookie(key="Authorization")
    return {"status": "logged out"}


@router.post("/change-password")
async def change_password(
    request: Request,
    data: ChangePassword,
    user: User = Depends(get_auth_user),
):
    if not auth_service.verify_password(data.current_password, user.hash_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    new_hash = auth_service.get_password_hash(data.new_password)
    await repository.update_user_password(user.id, new_hash)

    session_id = request.cookies.get("Authorization")
    if session_id:
        await repository.delete_user_sessions_except(user.id, UUID(session_id))

    return {"message": "Password changed successfully"}


@router.get("/users/search", response_model=list[UserPublic])
async def search_users(
    q: str = Query(min_length=2),
    user: User = Depends(get_auth_user),
):
    users = await repository.search_users(q, exclude_user_id=user.id)
    return users

@router.get("/sessions", response_model=SessionListResponse)
async def get_sessions(
    request: Request,
    user: User = Depends(get_auth_user),
):
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    current_session_id = request.cookies.get("Authorization")
    sessions = await repository.get_user_sessions(user.id)

    session_list = [
        SessionInfo(
            id=s.id,
            user_agent=s.user_agent,
            ip_address=s.ip_address,
            created_at=s.created_at,
            last_active_at=s.last_active_at,
            is_current=(str(s.id) == current_session_id),
        )
        for s in sessions
    ]

    return SessionListResponse(sessions=session_list)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_session(
    session_id: UUID,
    request: Request,
    user: User = Depends(get_auth_user),
):
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    current_session_id = request.cookies.get("Authorization")
    if str(session_id) == current_session_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot revoke current session. Use /auth/logout instead.",
        )

    session = await repository.get_session_by_id(session_id, user.id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    await repository.delete_session(session_id)


@router.delete("/sessions", response_model=RevokedSessionsResponse)
async def revoke_all_sessions(
    request: Request,
    user: User = Depends(get_auth_user),
):
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    current_session_id = request.cookies.get("Authorization")
    if not current_session_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    revoked_count = await repository.delete_user_sessions_except(
        user.id, UUID(current_session_id)
    )

    return RevokedSessionsResponse(revoked_count=revoked_count)
