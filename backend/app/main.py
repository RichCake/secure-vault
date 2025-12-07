from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, Request, status
from starlette.middleware.base import BaseHTTPMiddleware

from app.auth import repository as auth_repository
from app.auth.dependencies import get_auth_user
from app.auth.models import User
from app.auth.router import router as a_r
from app.notifications.router import router as n_r
from app.vault.router import router as v_r

app = FastAPI(title="Vault API", version="1.0.0")


class SessionActivityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        session_id = request.cookies.get("Authorization")
        if session_id:
            try:
                await auth_repository.update_session_last_active(UUID(session_id))
            except (ValueError, Exception):
                pass

        return response


app.add_middleware(SessionActivityMiddleware)


@app.get("/me")
async def get_me(user: User = Depends(get_auth_user)):
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return {"username": user.username}


app.include_router(a_r)
app.include_router(v_r)
app.include_router(n_r)
