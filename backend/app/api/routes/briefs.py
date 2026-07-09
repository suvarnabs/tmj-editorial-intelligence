from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import require_api_key
from app.db.repositories import briefs
from app.schemas.briefs import BriefGenerateRequest, BriefRead
from app.services.brief.service import generate_brief, today_in_brief_timezone

router = APIRouter(prefix="/api/v1/briefs", tags=["briefs"])


@router.get("", response_model=list[BriefRead])
def list_briefs(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[dict]:
    return briefs.list_briefs(limit=limit, offset=offset)


@router.get("/today", response_model=BriefRead)
def get_today_brief() -> dict:
    brief = briefs.get_brief_by_date(today_in_brief_timezone())
    if not brief:
        raise HTTPException(status_code=404, detail="Brief not found for today.")
    return brief


@router.post("/generate", response_model=BriefRead, dependencies=[Depends(require_api_key)])
def generate_daily_brief(payload: BriefGenerateRequest | None = None) -> dict:
    try:
        return generate_brief(
            brief_date=payload.brief_date if payload else None,
            limit=payload.limit if payload else None,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{brief_date}", response_model=BriefRead)
def get_brief(brief_date: date) -> dict:
    brief = briefs.get_brief_by_date(brief_date)
    if not brief:
        raise HTTPException(status_code=404, detail="Brief not found.")
    return brief
