from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.db.repositories import sources
from app.schemas.sources import SourceCreate, SourceRead, SourceUpdate

router = APIRouter(prefix="/api/v1/sources", tags=["sources"])


@router.get("", response_model=list[SourceRead])
def list_sources(active: bool | None = Query(default=None)) -> list[dict]:
    return sources.list_sources(active=active)


@router.post("", response_model=SourceRead, status_code=status.HTTP_201_CREATED)
def create_source(payload: SourceCreate) -> dict:
    try:
        return sources.create_source(payload.model_dump())
    except Exception as exc:
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
