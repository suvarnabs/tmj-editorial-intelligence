from datetime import date, datetime
from typing import Any

from psycopg.types.json import Jsonb

from app.db.client import get_connection


def list_briefs(limit: int = 20, offset: int = 0) -> list[dict[str, Any]]:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT *
                FROM editorial_briefs
                ORDER BY brief_date DESC
                LIMIT %s OFFSET %s
                """,
                (limit, offset),
            )
            return list(cur.fetchall())


def get_brief_by_date(brief_date: date) -> dict[str, Any] | None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM editorial_briefs WHERE brief_date = %s", (brief_date,))
            brief = cur.fetchone()

    return _attach_ranked_articles(brief) if brief else None


def _attach_ranked_articles(brief: dict[str, Any]) -> dict[str, Any]:
    ranked_ids = brief.get("ranked_article_ids") or []
    if not ranked_ids:
        brief["ranked_articles"] = []
        return brief

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    articles.id,
                    articles.title,
                    articles.url,
                    sources.name AS source_name,
                    articles.published_at,
                    articles.editorial_score,
                    articles.coverage_recommendation,
                    articles.processing_status
                FROM articles
                LEFT JOIN sources ON sources.id = articles.source_id
                WHERE articles.id = ANY(%s::uuid[])
                """,
                (ranked_ids,),
            )
            articles_by_id = {str(row["id"]): row for row in cur.fetchall()}

    ranked_articles: list[dict[str, Any]] = []
    for article_id in ranked_ids:
        article = articles_by_id.get(str(article_id))
        if article:
            ranked_articles.append(article)
        else:
            ranked_articles.append(
                {
                    "id": article_id,
                    "title": None,
                    "url": None,
                    "source_name": None,
                    "published_at": None,
                    "editorial_score": None,
                    "coverage_recommendation": None,
                    "processing_status": None,
                }
            )

    brief["ranked_articles"] = ranked_articles
    return brief


def upsert_brief(data: dict[str, Any]) -> dict[str, Any]:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO editorial_briefs (
                    brief_date,
                    generated_at,
                    status,
                    headline,
                    executive_summary,
                    sections,
                    ranked_article_ids,
                    metadata
                )
                VALUES (%s, now(), %s, %s, %s, %s, %s::uuid[], %s)
                ON CONFLICT (brief_date)
                DO UPDATE SET
                    generated_at = now(),
                    status = EXCLUDED.status,
                    headline = EXCLUDED.headline,
                    executive_summary = EXCLUDED.executive_summary,
                    sections = EXCLUDED.sections,
                    ranked_article_ids = EXCLUDED.ranked_article_ids,
                    metadata = EXCLUDED.metadata
                RETURNING *
                """,
                (
                    data["brief_date"],
                    data.get("status", "draft"),
                    data.get("headline"),
                    data.get("executive_summary"),
                    Jsonb(data["sections"]),
                    data["ranked_article_ids"],
                    Jsonb(data["metadata"]),
                ),
            )
            return cur.fetchone()


def list_completed_articles_for_window(
    *,
    start_utc: datetime,
    end_utc: datetime,
    limit: int,
) -> list[dict[str, Any]]:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT *
                FROM articles
                WHERE processing_status = 'completed'
                  AND summary IS NOT NULL
                  AND editorial_score IS NOT NULL
                  AND published_at >= %s
                  AND published_at < %s
                ORDER BY editorial_score DESC NULLS LAST,
                         CASE WHEN coverage_recommendation = 'today' THEN 0 ELSE 1 END,
                         published_at DESC NULLS LAST
                LIMIT %s
                """,
                (start_utc, end_utc, limit),
            )
            return list(cur.fetchall())


def list_recent_completed_articles(*, limit: int, exclude_ids: list[str] | None = None) -> list[dict[str, Any]]:
    exclude_ids = exclude_ids or []
    filters = [
        "processing_status = 'completed'",
        "summary IS NOT NULL",
        "editorial_score IS NOT NULL",
    ]
    params: list[Any] = []

    if exclude_ids:
        filters.append("id <> ALL(%s::uuid[])")
        params.append(exclude_ids)

    params.append(limit)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT *
                FROM articles
                WHERE {" AND ".join(filters)}
                ORDER BY editorial_score DESC NULLS LAST,
                         CASE WHEN coverage_recommendation = 'today' THEN 0 ELSE 1 END,
                         published_at DESC NULLS LAST,
                         fetched_at DESC
                LIMIT %s
                """,
                params,
            )
            return list(cur.fetchall())
