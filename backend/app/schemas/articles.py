from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, HttpUrl


class ArticleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    source_id: UUID
    source_name: str | None = None
    source_type: str | None = None
    source_publisher: str | None = None
    title: str
    url: HttpUrl
    author: str | None = None
    published_at: datetime | None = None
    fetched_at: datetime
    extracted_text: str
    word_count: int | None = None
    raw_html: str | None = None
    processing_status: str | None = None
    processing_error: str | None = None
    summary: str | None = None
    sentiment: str | None = None
    sentiment_score: float | None = None
    emotional_signals: dict | None = None
    stakeholder_stance: dict | None = None
    suggested_story_formats: list[str] | None = None
    kerala_relevance: str | None = None
    editorial_score: float | None = None
    coverage_recommendation: str | None = None
    recommended_angle: str | None = None
    themes: list[dict] | None = None
    tags: list[str] | None = None
    created_at: datetime
    updated_at: datetime
