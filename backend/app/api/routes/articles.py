from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.db.repositories import articles
from app.schemas.articles import ArticleRead

router = APIRouter(prefix="/api/v1/articles", tags=["articles"])


@router.get("", response_model=list[ArticleRead])
def list_articles(
    source_id: UUID | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[dict]:
    return articles.list_articles(
        source_id=str(source_id) if source_id else None,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        offset=offset,
    )


@router.get("/{article_id}", response_model=ArticleRead)
def get_article(article_id: UUID) -> dict:
    article = articles.get_article(str(article_id))
    if not article:
        raise HTTPException(status_code=404, detail="Article not found.")
    return article
