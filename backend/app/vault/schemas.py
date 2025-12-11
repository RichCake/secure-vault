import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class NodeBase(BaseModel):
    name: str = Field(min_length=1, max_length=512)
    parent_id: uuid.UUID | None = None


class FolderCreate(NodeBase):
    pass


class NodeUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=512)
    parent_id: uuid.UUID | None = None
    meta: dict[str, Any] | None = None


class Node(NodeBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    is_folder: bool
    owner_username: str
    storage_path: str | None
    size: int | None
    mime_type: str | None
    meta: dict[str, Any] | None
    created_at: datetime

    class Config:
        from_attributes = True


class ShareRequest(BaseModel):
    target_username: str
    permission: Literal["read", "write"] = "read"


class ShareUpdate(BaseModel):
    permission: Literal["read", "write"]


class ShareEntry(BaseModel):
    user_id: uuid.UUID
    username: str
    permission: Literal["read", "write"]

    class Config:
        from_attributes = True
