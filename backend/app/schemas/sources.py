from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class SourceBase(BaseModel):
    name: str = Field(min_length=1)
    source_type: str = "rss"
    feed_url: HttpUrl
    publisher: str | None = None
    region: str | None = None
    language: str = "en"
    is_active: bool = True
    notes: str | None = None


class SourceCreate(SourceBase):
    pass


class SourceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    source_type: str | None = None
    feed_url: HttpUrl | None = None
    publisher: str | None = None
    region: str | None = None
    language: str | None = None
    is_active: bool | None = None
    notes: str | None = None


class SourceRead(SourceBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    last_fetched_at: datetime | None = None
    last_error: str | None = None
    created_at: datetime
    updated_at: datetime
