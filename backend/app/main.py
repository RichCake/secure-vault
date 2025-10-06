from fastapi import Depends, FastAPI, HTTPException, status

from app.auth.dependencies import get_auth_user
from app.auth.models import User
from app.auth.router import router as a_r
from app.vault.router import router as v_r

app = FastAPI(title="Vault API", version="1.0.0")


@app.get("/me")
async def get_me(user: User = Depends(get_auth_user)):
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return {"username": user.username}


app.include_router(a_r)
app.include_router(v_r)
