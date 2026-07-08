from typing import Any

from app.db.client import get_connection


def list_themes(active: bool | None = True) -> list[dict[str, Any]]:
    query = "SELECT * FROM editorial_themes"
    params: list[Any] = []

    if active is not None:
        query += " WHERE is_active = %s"
        params.append(active)

    query += " ORDER BY sort_order ASC, name ASC"

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            return list(cur.fetchall())


def get_theme_map() -> dict[str, dict[str, Any]]:
    return {theme["slug"]: theme for theme in list_themes(active=True)}


def replace_article_themes(article_id: str, theme_matches: list[dict[str, Any]]) -> None:
    theme_map = get_theme_map()

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM article_themes WHERE article_id = %s", (article_id,))
            for match in theme_matches:
                theme = theme_map.get(match.get("slug"))
                if not theme:
                    continue
                confidence = max(0, min(float(match.get("confidence", 0)), 1))
                cur.execute(
                    """
                    INSERT INTO article_themes (article_id, theme_id, confidence)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (article_id, theme_id)
                    DO UPDATE SET confidence = EXCLUDED.confidence
                    """,
                    (article_id, theme["id"], confidence),
                )


def replace_article_tags(article_id: str, tags: list[str]) -> None:
    normalized = sorted({tag.strip().lower() for tag in tags if tag and tag.strip()})

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM article_tags WHERE article_id = %s", (article_id,))
            for tag in normalized[:12]:
                cur.execute(
                    """
                    INSERT INTO article_tags (article_id, tag)
                    VALUES (%s, %s)
                    ON CONFLICT (article_id, tag) DO NOTHING
                    """,
                    (article_id, tag[:80]),
                )
