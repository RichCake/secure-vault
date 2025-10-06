from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.database import async_session_maker
from app.vault.models import Node
from app.vault.schemas import NodeCreate, NodeUpdate


async def create_node(node_in: NodeCreate, owner: User, storage_path: str) -> Node:
    node = Node(**node_in.model_dump(), owner_id=owner.id, storage_path=storage_path)
    async with async_session_maker() as session:
        session.add(node)
        await session.commit()
        await session.refresh(node)
    return node


async def get_node_by_id(node_id: UUID) -> Node | None:
    async with async_session_maker() as session:
        stmt = select(Node).where(Node.id == node_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()


async def get_nodes_by_owner_id(owner_id: UUID) -> list[Node]:
    async with async_session_maker() as session:
        stmt = select(Node).where(Node.owner_id == owner_id)
        result = await session.execute(stmt)
        return result.scalars().all()


async def update_node(node_id: UUID, node_in: NodeUpdate) -> Node | None:
    async with async_session_maker() as session:
        stmt = select(Node).where(Node.id == node_id)
        result = await session.execute(stmt)
        node = result.scalar_one_or_none()
        if not node:
            return None

        for key, value in node_in.model_dump(exclude_unset=True).items():
            setattr(node, key, value)

        await session.commit()
        await session.refresh(node)
        return node


async def delete_node(node_id: UUID) -> bool:
    async with async_session_maker() as session:
        stmt = select(Node).where(Node.id == node_id)
        result = await session.execute(stmt)
        node = result.scalar_one_or_none()
        if not node:
            return False

        await session.delete(node)
        await session.commit()
        return True
