from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class NotificationCreate(BaseModel):
    user_id: UUID
    type: str = Field(max_length=64)
    payload: str = Field(max_length=1024)


class NotificationOut(BaseModel):
    id: UUID
    user_id: UUID
    type: str
    payload: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

