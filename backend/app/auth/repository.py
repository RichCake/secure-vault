from sqlalchemy import select, delete
from datetime import datetime

from app.auth.models import User, Session
from app.databese import async_session_maker


async def user_exists(username: str) -> bool:
    """Проверяет существование пользователя по username"""
    stmt = select(User).where(User.username == username)
    async with async_session_maker() as session:
        result = await session.scalar(stmt)
        return result is not None


async def get_user_by_username(username: str) -> User | None:
    """Получает пользователя по username"""
    stmt = select(User).where(User.username == username)
    async with async_session_maker() as session:
        result = await session.scalar(stmt)
        return result


async def get_user_by_id(user_id: int) -> User | None:
    """Получает пользователя по ID"""
    stmt = select(User).where(User.id == user_id)
    async with async_session_maker() as session:
        result = await session.scalar(stmt)
        return result


async def create_user(username: str, hash_password: str) -> User:
    """Создает нового пользователя"""
    new_user = User(username=username, hash_password=hash_password)
    async with async_session_maker() as session:
        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)
        return new_user


async def create_session(session_id: str, user_id: int, expires_at: datetime) -> Session:
    """Создает новую сессию"""
    new_session = Session(
        session_id=session_id,
        user_id=user_id,
        expires_at=expires_at
    )
    async with async_session_maker() as session:
        session.add(new_session)
        await session.commit()
        await session.refresh(new_session)
        return new_session


async def get_session(session_id: str) -> Session | None:
    """Получает сессию по ID с загруженным пользователем"""
    stmt = select(Session).where(Session.session_id == session_id)
    async with async_session_maker() as session:
        result = await session.scalar(stmt)
        return result


async def delete_session(session_id: str) -> bool:
    """Удаляет сессию по ID"""
    stmt = delete(Session).where(Session.session_id == session_id)
    async with async_session_maker() as session:
        result = await session.execute(stmt)
        await session.commit()
        return result.rowcount > 0


async def delete_user_sessions(user_id: int) -> int:
    """Удаляет все сессии пользователя"""
    stmt = delete(Session).where(Session.user_id == user_id)
    async with async_session_maker() as session:
        result = await session.execute(stmt)
        await session.commit()
        return result.rowcount


async def cleanup_expired_sessions() -> int:
    """Удаляет все истекшие сессии"""
    stmt = delete(Session).where(Session.expires_at < datetime.utcnow())
    async with async_session_maker() as session:
        result = await session.execute(stmt)
        await session.commit()
        return result.rowcount
