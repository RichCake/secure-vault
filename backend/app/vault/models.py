from typing import Any, Optional
from uuid import UUID

from sqlalchemy import BigInteger, Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Node(Base):
    owner_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    parent_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("nodes.id"), default=None, nullable=True
    )
    name: Mapped[str] = mapped_column(String(512))
    is_folder: Mapped[bool] = mapped_column(Boolean, default=False)
    storage_path: Mapped[Optional[str]] = mapped_column(
        String(1024), default=None, nullable=True
    )
    size: Mapped[Optional[int]] = mapped_column(BigInteger, default=None, nullable=True)
    mime_type: Mapped[Optional[str]] = mapped_column(String(256), default=None)
    meta: Mapped[Optional[dict[str, Any]]] = mapped_column(default=None)

    owner: Mapped["User"] = relationship(back_populates="nodes")  # noqa: F821
    parent: Mapped[Optional["Node"]] = relationship(
        back_populates="children", remote_side="Node.id"
    )
    children: Mapped[list["Node"]] = relationship(
        back_populates="parent", cascade="all, delete-orphan"
    )
    shared_with: Mapped[list["FileAccess"]] = relationship(
        back_populates="node", cascade="all, delete-orphan"
    )

    @property
    def owner_username(self) -> str:
        return self.owner.username if self.owner else ""


class FileAccess(Base):
    node_id: Mapped[UUID] = mapped_column(ForeignKey("nodes.id"))
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    permission: Mapped[str] = mapped_column(String(32), default="read")

    node: Mapped["Node"] = relationship(back_populates="shared_with")
    user: Mapped["User"] = relationship()  # noqa: F821
