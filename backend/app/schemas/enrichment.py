from typing import Any

from pydantic import BaseModel, Field


class EnrichmentRunRequest(BaseModel):
    limit: int | None = Field(default=None, ge=1, le=25)


class EnrichmentRunResponse(BaseModel):
    status: str
    attempted: int
    completed: int
    failed: int
    errors: list[dict[str, Any]]


class EnrichmentStatusResponse(BaseModel):
    counts: dict[str, int]
