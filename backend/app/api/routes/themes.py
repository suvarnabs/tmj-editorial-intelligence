from fastapi import APIRouter

from app.db.repositories import themes
from app.schemas.themes import ThemeRead

router = APIRouter(prefix="/api/v1/themes", tags=["themes"])


@router.get("", response_model=list[ThemeRead])
def list_themes() -> list[dict]:
    return themes.list_themes(active=True)
