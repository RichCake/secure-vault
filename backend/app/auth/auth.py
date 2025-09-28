from fastapi import HTTPException
from passlib.context import CryptContext

from app.auth import repository

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


async def check_and_create_user(username, password):
    user = await repository.get_user(username)
    if user is not None:
        raise HTTPException(status_code=400, detail="user already exists")
    return await repository.create_user(username, get_password_hash(password))


async def login(username, password):
    user = await repository.get_user(username)
    if not user or not verify_password(password, user.hash_password):
        raise HTTPException(status_code=400, detail="wrong username or password")
    return await create_session(user)


async def create_session(user):
    session = await repository.get_session(user)
    if session:
        return session.id
    session = await repository.create_session(user)
    return session.id


async def delete_session(session_id):
    pass


async def check_session(session_id):
    if session_id:
        return await repository.get_user_by_session(session_id)
