from fastapi import Request

from app.auth import auth as auth_service


async def get_auth_user(request: Request):
    session_id = request.cookies.get("Authorization")
    return await auth_service.check_session(session_id)
