import uuid
from datetime import datetime

from pydantic import BaseModel


class NodeBase(BaseModel):
    name_encrypted: str
    meta: dict
    hash: str


class NodeCreate(NodeBase):
    parent_id: uuid.UUID | None = None


class NodeUpdate(NodeBase):
    pass


class Node(NodeBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    parent_id: uuid.UUID | None
    storage_path: str
    created_at: datetime

    class Config:
        from_attributes = True
