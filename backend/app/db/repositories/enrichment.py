from app.db.client import get_connection


def get_status_counts() -> dict[str, int]:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT processing_status, count(*) AS count
                FROM articles
                GROUP BY processing_status
                ORDER BY processing_status
                """
            )
            rows = cur.fetchall()

    return {row["processing_status"]: row["count"] for row in rows}
