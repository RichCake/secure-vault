from typing import List, Optional

from databese import Base
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class User(Base):
    username: Mapped[str]


class Session(Base):
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
