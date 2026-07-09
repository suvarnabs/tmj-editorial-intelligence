from typing import Any

from psycopg.types.json import Jsonb

from app.db.client import get_connection


def list_articles(
    *,
    source_id: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    status: str | None = None,
    theme: str | None = None,
    min_score: float | None = None,
    limit: int = 20,
    offset: int = 0,
) -> list[dict[str, Any]]:
    filters: list[str] = []
    params: list[Any] = []

    if source_id:
        filters.append("source_id = %s")
        params.append(source_id)
    if date_from:
        filters.append("published_at >= %s")
        params.append(date_from)
    if date_to:
        filters.append("published_at <= %s")
        params.append(date_to)
    if status:
        filters.append("processing_status = %s")
        params.append(status)
    if min_score is not None:
        filters.append("editorial_score >= %s")
        params.append(min_score)
    if theme:
        filters.append(
            """
            EXISTS (
                SELECT 1
                FROM article_themes at
                JOIN editorial_themes et ON et.id = at.theme_id
                WHERE at.article_id = articles.id
                AND et.slug = %s
            )
            """
        )
        params.append(theme)

    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""
    params.extend([limit, offset])

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT
                    articles.*,
                    sources.name AS source_name,
                    sources.source_type AS source_type,
                    sources.publisher AS source_publisher
                FROM articles
                LEFT JOIN sources ON sources.id = articles.source_id
                {where_clause}
                ORDER BY published_at DESC NULLS LAST, created_at DESC
                LIMIT %s OFFSET %s
                """,
                params,
            )
            return list(cur.fetchall())


def _attach_article_taxonomy(article: dict[str, Any]) -> dict[str, Any]:
    article_id = str(article["id"])
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT et.slug, et.name, at.confidence
                FROM article_themes at
                JOIN editorial_themes et ON et.id = at.theme_id
                WHERE at.article_id = %s
                ORDER BY at.confidence DESC, et.name ASC
                """,
                (article_id,),
            )
            article["themes"] = list(cur.fetchall())

            cur.execute(
                """
                SELECT tag
                FROM article_tags
                WHERE article_id = %s
                ORDER BY tag ASC
                """,
                (article_id,),
            )
            article["tags"] = [row["tag"] for row in cur.fetchall()]

    return article


def get_article(article_id: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    articles.*,
                    sources.name AS source_name,
                    sources.source_type AS source_type,
                    sources.publisher AS source_publisher
                FROM articles
                LEFT JOIN sources ON sources.id = articles.source_id
                WHERE articles.id = %s
                """,
                (article_id,),
            )
            article = cur.fetchone()

    if not article:
        return None

    return _attach_article_taxonomy(article)


def list_pending_for_enrichment(limit: int) -> list[dict[str, Any]]:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT *
                FROM articles
                WHERE processing_status = 'pending'
                ORDER BY published_at DESC NULLS LAST, fetched_at DESC
                LIMIT %s
                """,
                (limit,),
            )
            return list(cur.fetchall())


def mark_processing(article_id: str) -> None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE articles
                SET processing_status = 'processing',
                    processing_error = NULL,
                    updated_at = now()
                WHERE id = %s
                """,
                (article_id,),
            )


def mark_failed(article_id: str, error: str) -> None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE articles
                SET processing_status = 'failed',
                    processing_error = %s,
                    updated_at = now()
                WHERE id = %s
                """,
                (error[:2000], article_id),
            )


def save_enrichment(article_id: str, data: dict[str, Any], editorial_score: float) -> dict[str, Any]:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE articles
                SET processing_status = 'completed',
                    processing_error = NULL,
                    summary = %s,
                    sentiment = %s,
                    sentiment_score = %s,
                    emotional_signals = %s,
                    stakeholder_stance = %s,
                    suggested_story_formats = %s,
                    kerala_relevance = %s,
                    editorial_score = %s,
                    coverage_recommendation = %s,
                    recommended_angle = %s,
                    updated_at = now()
                WHERE id = %s
                RETURNING *
                """,
                (
                    data["summary"],
                    data["sentiment"],
                    data["sentiment_score"],
                    Jsonb(data["emotional_signals"]),
                    Jsonb(data["stakeholder_stance"]),
                    Jsonb(data["suggested_story_formats"]),
                    data["kerala_relevance"],
                    editorial_score,
                    data["coverage_recommendation"],
                    data["recommended_angle"],
                    article_id,
                ),
            )
            return cur.fetchone()


def reset_for_reprocessing(article_id: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM article_themes WHERE article_id = %s", (article_id,))
            cur.execute("DELETE FROM article_tags WHERE article_id = %s", (article_id,))
            cur.execute(
                """
                UPDATE articles
                SET processing_status = 'pending',
                    processing_error = NULL,
                    updated_at = now()
                WHERE id = %s
                RETURNING *
                """,
                (article_id,),
            )
            return cur.fetchone()


def insert_article(data: dict[str, Any]) -> dict[str, Any] | None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO articles (
                    source_id,
                    title,
                    url,
                    author,
                    published_at,
                    fetched_at,
                    extracted_text,
                    word_count,
                    raw_html
                )
                VALUES (%s, %s, %s, %s, %s, now(), %s, %s, %s)
                ON CONFLICT (url) DO NOTHING
                RETURNING *
                """,
                (
                    data["source_id"],
                    data["title"],
                    data["url"],
                    data.get("author"),
                    data.get("published_at"),
                    data["extracted_text"],
                    data.get("word_count"),
                    data.get("raw_html"),
                ),
            )
            return cur.fetchone()
