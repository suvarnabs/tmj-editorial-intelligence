from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class IngestionRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    started_at: datetime
    completed_at: datetime | None = None
    status: str
    sources_attempted: int
    sources_succeeded: int
    articles_fetched: int
    articles_new: int
    error_summary: list[dict[str, Any]] | dict[str, Any] | None = None
    triggered_by: str | None = None
