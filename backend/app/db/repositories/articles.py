from typing import Any

from app.db.client import get_connection


def list_articles(
    *,
    source_id: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    limit: int = 50,
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

    where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""
    params.extend([limit, offset])

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT *
                FROM articles
                {where_clause}
                ORDER BY published_at DESC NULLS LAST, fetched_at DESC
                LIMIT %s OFFSET %s
                """,
                params,
            )
            return list(cur.fetchall())


def get_article(article_id: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM articles WHERE id = %s", (article_id,))
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
