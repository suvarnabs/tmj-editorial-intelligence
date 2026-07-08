from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import require_api_key
from app.db.repositories import ingestion_runs
from app.schemas.ingestion import IngestionRunRead
from app.services.ingestion.service import run_ingestion

router = APIRouter(prefix="/api/v1/ingestion", tags=["ingestion"])


@router.post("/run", response_model=IngestionRunRead, dependencies=[Depends(require_api_key)])
def trigger_ingestion() -> dict:
    return run_ingestion()


@router.get("/runs", response_model=list[IngestionRunRead])
def list_ingestion_runs(limit: int = Query(default=20, ge=1, le=100)) -> list[dict]:
    return ingestion_runs.list_runs(limit=limit)


@router.get("/runs/{run_id}", response_model=IngestionRunRead)
def get_ingestion_run(run_id: UUID) -> dict:
    run = ingestion_runs.get_run(str(run_id))
    if not run:
        raise HTTPException(status_code=404, detail="Ingestion run not found.")
    return run
