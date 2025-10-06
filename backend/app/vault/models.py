from datetime import datetime, timedelta, timezone
from typing import Any, List, Optional
from uuid import UUID

from sqlalchemy import ForeignKey, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from app.database import Base


class Node(Base):
    owner_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    parent_id: Mapped[UUID] = mapped_column(ForeignKey("nodes.id"))
    name_encrypted: Mapped[str]
    storage_path: Mapped[str]
    meta: Mapped[dict[str, Any]]
    hash: Mapped[str]

    owner: Mapped["User"] = relationship(back_populates="nodes")  # noqa: F821
    parent: Mapped["Node"] = relationship(back_populates="children")
