from fastapi import APIRouter, Depends

from app.api.deps import require_api_key
from app.db.repositories.enrichment import get_status_counts
from app.schemas.enrichment import (
    EnrichmentRunRequest,
    EnrichmentRunResponse,
    EnrichmentStatusResponse,
)
from app.services.enrichment.service import run_enrichment

router = APIRouter(prefix="/api/v1/enrichment", tags=["enrichment"])


@router.post("/run", response_model=EnrichmentRunResponse, dependencies=[Depends(require_api_key)])
def trigger_enrichment(payload: EnrichmentRunRequest | None = None) -> dict:
    limit = payload.limit if payload else None
    return run_enrichment(limit=limit)


@router.get("/status", response_model=EnrichmentStatusResponse)
def enrichment_status() -> dict:
    return {"counts": get_status_counts()}
