from fastapi import APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import RedirectResponse

import app.auth.auth as auth_service
from app.auth import errors
from app.auth.schemas import UserCredentials
from app.auth.dependencies import get_current_user, require_auth
from app.auth.models import User

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register")
async def register(user: UserCredentials):
    """Регистрация нового пользователя"""
    try:
        await auth_service.check_and_create_user(user.username, user.password)
    except errors.UserAlreadyExists as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    session_id = await auth_service.create_session(user.username)
    response = RedirectResponse("/", status_code=302)
    response.set_cookie(
        key="Authorization", 
        value=session_id,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7*24*60*60  # 7 дней
    )
    return response


@router.post("/login")
async def login(user: UserCredentials):
    """Вход в систему"""
    if not await auth_service.check_password(user.username, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    try:
        session_id = await auth_service.create_session(user.username)
    except errors.UserNotFound:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    response = RedirectResponse("/", status_code=302)
    response.set_cookie(
        key="Authorization", 
        value=session_id,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7*24*60*60  # 7 дней
    )
    return response


@router.post("/logout")
async def logout(request: Request, response: Response):
    """Выход из системы"""
    session_id = request.cookies.get("Authorization")
    if session_id:
        await auth_service.delete_session(session_id)
    
    response.delete_cookie(
        key="Authorization",
        httponly=True,
        secure=True,
        samesite="lax"
    )
    return {"status": "logged out"}


@router.get("/me")
async def get_current_user_info(current_user: User = Depends(require_auth())):
    """Получение информации о текущем пользователе"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "created_at": current_user.created_at
    }


@router.get("/check")
async def check_auth_status(request: Request):
    """Проверка статуса аутентификации"""
    session_id = request.cookies.get("Authorization")
    is_authenticated = await auth_service.check_session(session_id)
    
    if is_authenticated:
        user = await auth_service.get_user_from_session(session_id)
        return {
            "authenticated": True,
            "user": {
                "id": user.id,
                "username": user.username,
                "created_at": user.created_at
            }
        }
    
    return {"authenticated": False}
