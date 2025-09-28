from fastapi import Depends, FastAPI

from app.auth.dependencies import get_auth_user
from app.auth.models import User
from app.auth.router import router as auth_router

app = FastAPI(title="Vault API", version="1.0.0")


@app.get("/me")
async def get_me(user: User = Depends(get_auth_user)):
    return {"user": user.username}


app.include_router(auth_router)
