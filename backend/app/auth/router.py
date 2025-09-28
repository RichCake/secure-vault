import datetime as dt

from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import RedirectResponse

import app.auth.auth as auth_service
from app.auth import errors
from app.auth.schemas import UserCredentials

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register")
async def register(response: Response, user: UserCredentials):
    new_user = await auth_service.check_and_create_user(user.username, user.password)

    session_id = await auth_service.create_session(new_user)
    response.set_cookie(
        key="Authorization",
        value=session_id,
        expires=dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=365),
    )
    return {"username": user.username}


@router.post("/login")
async def session_login(response: Response, user: UserCredentials):
    session_id = await auth_service.login(user.username, user.password)
    response.set_cookie(
        key="Authorization",
        value=session_id,
        expires=dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=365),
    )
    return {"username": user.username}


@router.post("/logout")
async def session_logout(response: Response):
    response.delete_cookie(key="Authorization")
    return {"status": "logged out"}
