from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.auth.models import Session, User
from app.database import async_session_maker


async def get_user(username: str) -> User | None:
    stmt = select(User).where(User.username == username)
    async with async_session_maker() as session:
        data = await session.scalars(stmt)
        return data.first()


async def get_user_by_id(user_id: UUID) -> User | None:
    async with async_session_maker() as session:
        stmt = select(User).where(User.id == user_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()


async def search_users(query: str, exclude_user_id: UUID, limit: int = 20) -> list[User]:
    like_expr = f"%{query}%"
    async with async_session_maker() as session:
        stmt = (
            select(User)
            .where(User.username.ilike(like_expr))
            .where(User.id != exclude_user_id)
            .order_by(User.username.asc())
            .limit(limit)
        )
        result = await session.execute(stmt)
        return result.scalars().all()


async def update_user_password(user_id: UUID, new_hash_password: str) -> bool:
    async with async_session_maker() as session:
        stmt = select(User).where(User.id == user_id)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            return False
        user.hash_password = new_hash_password
        await session.commit()
        return True


async def delete_user_sessions_except(user_id: UUID, keep_session_id: UUID) -> int:
    """Delete all sessions except the one with keep_session_id. Returns count of deleted."""
    async with async_session_maker() as session:
        stmt = select(Session).where(
            (Session.user_id == user_id) & (Session.id != keep_session_id)
        )
        result = await session.execute(stmt)
        sessions = result.scalars().all()
        count = len(sessions)
        for s in sessions:
            await session.delete(s)
        await session.commit()
        return count


async def create_user(username, hash_password):
    new_user = User(username=username, hash_password=hash_password)
    async with async_session_maker() as session:
        session.add(new_user)
        await session.commit()
    return new_user


async def create_session(
    user,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> Session:
    """Create a new session with metadata."""
    expires_at = datetime.now() + timedelta(days=365)
    new_session = Session(
        user=user,
        expires_at=expires_at,
        user_agent=user_agent,
        ip_address=ip_address,
        last_active_at=datetime.now(),
    )
    async with async_session_maker() as session:
        session.add(new_session)
        await session.commit()
    return new_session


async def get_session(user):
    stmt = select(Session).where(
        (Session.user_id == user.id) & (Session.expires_at > datetime.now())
    )
    async with async_session_maker() as session:
        data = await session.scalars(stmt)
        return data.first()


async def get_user_by_session(session_id):
    stmt = (
        select(Session)
        .options(selectinload(Session.user))
        .where((Session.id == session_id) & (Session.expires_at > datetime.now()))
    )
    async with async_session_maker() as session:
        data = await session.scalars(stmt)
        session = data.first()
        return session.user if session else None


async def get_user_sessions(user_id: UUID) -> list[Session]:
    """Get all active sessions for a user."""
    stmt = (
        select(Session)
        .where((Session.user_id == user_id) & (Session.expires_at > datetime.now()))
        .order_by(Session.last_active_at.desc())
    )
    async with async_session_maker() as session:
        result = await session.execute(stmt)
        return result.scalars().all()


async def get_session_by_id(session_id: UUID, user_id: UUID) -> Session | None:
    """Get a specific session by ID for a user."""
    stmt = select(Session).where(
        (Session.id == session_id) & (Session.user_id == user_id)
    )
    async with async_session_maker() as session:
        result = await session.execute(stmt)
        return result.scalar_one_or_none()


async def delete_session(session_id: UUID) -> bool:
    """Delete a session by ID."""
    async with async_session_maker() as session:
        stmt = select(Session).where(Session.id == session_id)
        result = await session.execute(stmt)
        sess = result.scalar_one_or_none()
        if not sess:
            return False
        await session.delete(sess)
        await session.commit()
        return True


async def update_session_last_active(session_id: UUID) -> None:
    """Update last_active_at for a session."""
    async with async_session_maker() as session:
        stmt = select(Session).where(Session.id == session_id)
        result = await session.execute(stmt)
        sess = result.scalar_one_or_none()
        if sess:
            sess.last_active_at = datetime.now()
            await session.commit()
