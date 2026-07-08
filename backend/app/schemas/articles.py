from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, HttpUrl


class ArticleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    source_id: UUID
    title: str
    url: HttpUrl
    author: str | None = None
    published_at: datetime | None = None
    fetched_at: datetime
    extracted_text: str
    word_count: int | None = None
    raw_html: str | None = None
    created_at: datetime
    updated_at: datetime
