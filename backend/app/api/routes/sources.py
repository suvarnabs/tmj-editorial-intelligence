from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from psycopg.errors import UniqueViolation

from app.db.repositories import sources
from app.schemas.sources import SourceCreate, SourceRead, SourceUpdate

router = APIRouter(prefix="/api/v1/sources", tags=["sources"])

DUPLICATE_FEED_URL_MESSAGE = (
    "This feed URL already exists. Edit the existing source instead of adding a duplicate."
)


def _is_duplicate_feed_url_error(exc: Exception) -> bool:
    if isinstance(exc, UniqueViolation):
        constraint_name = getattr(exc.diag, "constraint_name", "")
        return constraint_name == "sources_feed_url_key"

    return "sources_feed_url_key" in str(exc)


@router.get("", response_model=list[SourceRead])
def list_sources(active: bool | None = Query(default=None)) -> list[dict]:
    return sources.list_sources(active=active)


@router.post("", response_model=SourceRead, status_code=status.HTTP_201_CREATED)
def create_source(payload: SourceCreate) -> dict:
    try:
        return sources.create_source(payload.model_dump())
    except Exception as exc:
        if _is_duplicate_feed_url_error(exc):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=DUPLICATE_FEED_URL_MESSAGE,
            ) from exc
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{source_id}", response_model=SourceRead)
def get_source(source_id: UUID) -> dict:
    source = sources.get_source(str(source_id))
    if not source:
        raise HTTPException(status_code=404, detail="Source not found.")
    return source


@router.patch("/{source_id}", response_model=SourceRead)
def update_source(source_id: UUID, payload: SourceUpdate) -> dict:
    try:
        source = sources.update_source(str(source_id), payload.model_dump(exclude_unset=True))
    except Exception as exc:
        if _is_duplicate_feed_url_error(exc):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=DUPLICATE_FEED_URL_MESSAGE,
            ) from exc
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not source:
        raise HTTPException(status_code=404, detail="Source not found.")
    return source


@router.delete("/{source_id}", response_model=SourceRead)
def delete_source(source_id: UUID) -> dict:
    source = sources.soft_delete_source(str(source_id))
    if not source:
        raise HTTPException(status_code=404, detail="Source not found.")
    return source
