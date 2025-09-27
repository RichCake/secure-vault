from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.auth import auth as auth_service
from app.auth.models import User


async def get_current_user(request: Request) -> User:
    """Получает текущего пользователя из сессии"""
    session_id = request.cookies.get("Authorization")
    
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user = await auth_service.get_user_from_session(session_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    return user


async def get_current_user_optional(request: Request) -> User | None:
    """Получает текущего пользователя из сессии (опционально)"""
    session_id = request.cookies.get("Authorization")
    
    if not session_id:
        return None
    
    user = await auth_service.get_user_from_session(session_id)
    return user


def require_auth():
    """Зависимость для проверки аутентификации"""
    return Depends(get_current_user)


def optional_auth():
    """Зависимость для опциональной аутентификации"""
    return Depends(get_current_user_optional)
