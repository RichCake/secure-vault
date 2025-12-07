from uuid import UUID

from sqlalchemy import delete, select

from app.database import async_session_maker
from app.notifications.models import Notification


async def create_notification(user_id: UUID, type: str, payload: str) -> Notification:
    async with async_session_maker() as session:
        notification = Notification(user_id=user_id, type=type, payload=payload)
        session.add(notification)
        await session.commit()
        await session.refresh(notification)
        return notification


async def get_notifications_for_user(user_id: UUID) -> list[Notification]:
    async with async_session_maker() as session:
        stmt = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())


async def get_notification_by_id(notification_id: UUID) -> Notification | None:
    async with async_session_maker() as session:
        stmt = select(Notification).where(Notification.id == notification_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()


async def delete_notification(notification_id: UUID) -> bool:
    async with async_session_maker() as session:
        stmt = delete(Notification).where(Notification.id == notification_id)
        result = await session.execute(stmt)
        await session.commit()
        return result.rowcount > 0


async def delete_all_notifications_for_user(user_id: UUID) -> int:
    async with async_session_maker() as session:
        stmt = delete(Notification).where(Notification.user_id == user_id)
        result = await session.execute(stmt)
        await session.commit()
        return result.rowcount

