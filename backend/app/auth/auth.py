from fastapi import Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse

# This must be randomly generated
RANDON_SESSION_ID = "iskksioskassyidd"

# This must be a lookup on user database
USER_CORRECT = ("admin", "admin")

# This must be Redis, Memcached, SQLite, KV, etc...
SESSION_DB = {}


@app.post("/login")
async def session_login(username: str, password: str):
    """/login?username=ssss&password=1234234234"""
    allow = (username, password) == USER_CORRECT
    if allow is False:
        raise HTTPException(status_code=401)
    response = RedirectResponse("/", status_code=302)
    response.set_cookie(key="Authorization", value=RANDON_SESSION_ID)
    SESSION_DB[RANDON_SESSION_ID] = username
    return response


@app.post("/logout")
async def session_logout(response: Response):
    response.delete_cookie(key="Authorization")
    SESSION_DB.pop(RANDON_SESSION_ID, None)
    return {"status": "logged out"}


def get_auth_user(request: Request):
    """verify that user has a valid session"""
    session_id = request.cookies.get("Authorization")
    if not session_id:
        raise HTTPException(status_code=401)
    if session_id not in SESSION_DB:
        raise HTTPException(status_code=403)
    return True


@app.get("/", dependencies=[Depends(get_auth_user)])
async def secret():
    return {"secret": "info"}
