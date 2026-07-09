from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class BriefGenerateRequest(BaseModel):
    brief_date: date | None = Field(default=None, alias="date")
    limit: int | None = Field(default=None, ge=1, le=25)


class BriefRankedArticle(BaseModel):
    id: UUID
    title: str | None = None
    url: str | None = None
    source_name: str | None = None
    published_at: datetime | None = None
    editorial_score: float | None = None
    coverage_recommendation: str | None = None
    processing_status: str | None = None


class BriefRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    brief_date: date
    generated_at: datetime
    status: str
    headline: str | None = None
    executive_summary: str | None = None
    sections: dict[str, Any]
    ranked_article_ids: list[UUID] | None = None
    ranked_articles: list[BriefRankedArticle] | None = None
    metadata: dict[str, Any] | None = None
    created_at: datetime
