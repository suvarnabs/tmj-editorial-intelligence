from typing import Any

from app.db.client import get_connection


def list_sources(active: bool | None = None) -> list[dict[str, Any]]:
    query = "SELECT * FROM sources"
    params: list[Any] = []

    if active is not None:
        query += " WHERE is_active = %s"
        params.append(active)

    query += " ORDER BY name ASC"

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            return list(cur.fetchall())


def get_source(source_id: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM sources WHERE id = %s", (source_id,))
            return cur.fetchone()


def create_source(data: dict[str, Any]) -> dict[str, Any]:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO sources (name, feed_url, publisher, region, language, is_active)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    data["name"],
                    str(data["feed_url"]),
                    data.get("publisher"),
                    data.get("region"),
                    data.get("language", "en"),
                    data.get("is_active", True),
                ),
            )
            return cur.fetchone()


def update_source(source_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    clean_data = {key: value for key, value in data.items() if value is not None}
    if "feed_url" in clean_data:
        clean_data["feed_url"] = str(clean_data["feed_url"])

    if not clean_data:
        return get_source(source_id)

    assignments = [f"{key} = %s" for key in clean_data]
    values = list(clean_data.values())
    values.append(source_id)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                UPDATE sources
                SET {", ".join(assignments)}, updated_at = now()
                WHERE id = %s
                RETURNING *
                """,
                values,
            )
            return cur.fetchone()


def soft_delete_source(source_id: str) -> dict[str, Any] | None:
    return update_source(source_id, {"is_active": False})


def mark_source_success(source_id: str) -> None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE sources
                SET last_fetched_at = now(), last_error = NULL, updated_at = now()
                WHERE id = %s
                """,
                (source_id,),
            )


def mark_source_error(source_id: str, error: str) -> None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE sources
                SET last_error = %s, updated_at = now()
                WHERE id = %s
                """,
                (error[:1000], source_id),
            )
