from fastapi import Depends, FastAPI

from app.auth.dependencies import get_auth_user
from app.auth.router import router as auth_router

app = FastAPI(title="Vault API", version="1.0.0")


@app.get("/", dependencies=[Depends(get_auth_user)])
async def secret():
    return {"secret": "info"}


app.include_router(auth_router)
