from typing import Any
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import joinedload

from app.auth.models import User
from app.database import async_session_maker
from app.vault.models import FileAccess, Node
from app.vault.schemas import NodeUpdate


async def create_node(
    *,
    owner: User,
    name: str,
    is_folder: bool,
    parent_id: UUID | None,
    storage_path: str | None,
    size: int | None,
    mime_type: str | None,
    meta: dict[str, Any] | None = None,
) -> Node:
    node = Node(
        owner_id=owner.id,
        name=name,
        is_folder=is_folder,
        parent_id=parent_id,
        storage_path=storage_path,
        size=size,
        mime_type=mime_type,
        meta=meta,
    )
    async with async_session_maker() as session:
        session.add(node)
        await session.commit()
        await session.refresh(node)
        node.owner = owner
    return node


async def get_node_by_id(node_id: UUID) -> Node | None:
    async with async_session_maker() as session:
        stmt = select(Node).options(joinedload(Node.owner)).where(Node.id == node_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()


async def get_node_for_user(node_id: UUID, user_id: UUID) -> Node | None:
    shared = (
        select(FileAccess.node_id).where(FileAccess.user_id == user_id).scalar_subquery()
    )
    async with async_session_maker() as session:
        stmt = (
            select(Node)
            .options(joinedload(Node.owner))
            .where(
                (Node.id == node_id)
                & (or_(Node.owner_id == user_id, Node.id.in_(shared)))
            )
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()


async def list_nodes_for_user(
    user_id: UUID,
    parent_id: UUID | None = None,
    shared_filter: bool | None = None,
) -> list[Node]:
    shared_subq = (
        select(FileAccess.node_id).where(FileAccess.user_id == user_id).scalar_subquery()
    )
    async with async_session_maker() as session:
        if shared_filter is True:
            stmt = select(Node).options(joinedload(Node.owner)).where(
                (Node.id.in_(shared_subq)) & (Node.owner_id != user_id)
            )
        elif shared_filter is False:
            stmt = (
                select(Node)
                .options(joinedload(Node.owner))
                .where(Node.owner_id == user_id)
            )
        else:
            stmt = (
                select(Node)
                .options(joinedload(Node.owner))
                .where(or_(Node.owner_id == user_id, Node.id.in_(shared_subq)))
            )

        if parent_id is None:
            stmt = stmt.where(Node.parent_id.is_(None))
        else:
            stmt = stmt.where(Node.parent_id == parent_id)

        stmt = stmt.order_by(Node.is_folder.desc(), Node.name.asc())
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


async def update_node_content(
    node_id: UUID,
    *,
    size: int,
    mime_type: str,
    original_filename: str | None = None,
) -> Node | None:
    async with async_session_maker() as session:
        stmt = select(Node).options(joinedload(Node.owner)).where(Node.id == node_id)
        result = await session.execute(stmt)
        node = result.scalar_one_or_none()
        if not node:
            return None

        node.size = size
        node.mime_type = mime_type
        if original_filename:
            meta = node.meta or {}
            meta["original_filename"] = original_filename
            node.meta = meta

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


async def search_nodes(user_id: UUID, query: str) -> list[Node]:
    like_expr = f"%{query}%"
    shared = (
        select(FileAccess.node_id).where(FileAccess.user_id == user_id).scalar_subquery()
    )
    async with async_session_maker() as session:
        stmt = (
            select(Node)
            .options(joinedload(Node.owner))
            .where(or_(Node.owner_id == user_id, Node.id.in_(shared)))
            .where(Node.name.ilike(like_expr))
            .order_by(Node.name.asc())
        )
        result = await session.execute(stmt)
        return result.scalars().all()


async def grant_access(node: Node, target_user: User, permission: str) -> FileAccess:
    async with async_session_maker() as session:
        stmt = select(FileAccess).where(
            (FileAccess.node_id == node.id) & (FileAccess.user_id == target_user.id)
        )
        existing = (await session.execute(stmt)).scalar_one_or_none()
        if existing:
            existing.permission = permission
            await session.commit()
            await session.refresh(existing)
            return existing

        access = FileAccess(
            node_id=node.id, user_id=target_user.id, permission=permission
        )
        session.add(access)
        await session.commit()
        await session.refresh(access)
        return access


async def revoke_access(node_id: UUID, user_id: UUID) -> bool:
    async with async_session_maker() as session:
        stmt = select(FileAccess).where(
            (FileAccess.node_id == node_id) & (FileAccess.user_id == user_id)
        )
        access = (await session.execute(stmt)).scalar_one_or_none()
        if not access:
            return False
        await session.delete(access)
        await session.commit()
        return True


async def list_access_entries(node_id: UUID) -> list[FileAccess]:
    async with async_session_maker() as session:
        stmt = (
            select(FileAccess)
            .options(joinedload(FileAccess.user))
            .where(FileAccess.node_id == node_id)
        )
        result = await session.execute(stmt)
        return result.scalars().all()
