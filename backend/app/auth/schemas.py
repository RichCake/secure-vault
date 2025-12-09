from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class UserCredentials(BaseModel):
    username: str
    password: str


class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


class UserPublic(BaseModel):
    id: UUID
    username: str

    class Config:
        from_attributes = True


class SessionInfo(BaseModel):
    id: UUID
    user_agent: str | None
    ip_address: str | None
    created_at: datetime
    last_active_at: datetime
    is_current: bool

    class Config:
        from_attributes = True


class SessionListResponse(BaseModel):
    sessions: list[SessionInfo]


class RevokedSessionsResponse(BaseModel):
    revoked_count: int
