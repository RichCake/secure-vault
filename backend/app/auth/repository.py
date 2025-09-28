from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.auth.models import Session, User
from app.databese import async_session_maker


async def get_user(username) -> User | None:
    stmt = select(User).where(User.username == username)
    async with async_session_maker() as session:
        data = await session.scalars(stmt)
        return data.first()


async def create_user(username, hash_password):
    new_user = User(username=username, hash_password=hash_password)
    async with async_session_maker() as session:
        session.add(new_user)
        await session.commit()
    return new_user


async def create_session(user):
    expires_at = datetime.now() + timedelta(days=365)
    new_session = Session(user=user, expires_at=expires_at)
    async with async_session_maker() as session:
        session.add(new_session)
        await session.commit()
    return new_session


async def get_session(user):
    stmt = select(Session).where(
        Session.user == user and Session.expires_at > datetime.now()
    )
    async with async_session_maker() as session:
        data = await session.scalars(stmt)
        return data.first()


async def get_user_by_session(session_id):
    stmt = (
        select(Session)
        .options(selectinload(Session.user))
        .where(Session.id == session_id and Session.expires_at > datetime.now())
    )
    async with async_session_maker() as session:
        data = await session.scalars(stmt)
        session = data.first()
        return session.user if session else None
