from typing import Any

from psycopg.types.json import Jsonb

from app.db.client import get_connection


def create_run(triggered_by: str = "manual") -> dict[str, Any]:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO ingestion_runs (started_at, status, triggered_by)
                VALUES (now(), 'running', %s)
                RETURNING *
                """,
                (triggered_by,),
            )
            return cur.fetchone()


def complete_run(
    run_id: str,
    *,
    status: str,
    sources_attempted: int,
    sources_succeeded: int,
    articles_fetched: int,
    articles_new: int,
    error_summary: list[dict[str, Any]],
) -> dict[str, Any]:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE ingestion_runs
                SET completed_at = now(),
                    status = %s,
                    sources_attempted = %s,
                    sources_succeeded = %s,
                    articles_fetched = %s,
                    articles_new = %s,
                    error_summary = %s
                WHERE id = %s
                RETURNING *
                """,
                (
                    status,
                    sources_attempted,
                    sources_succeeded,
                    articles_fetched,
                    articles_new,
                    Jsonb(error_summary) if error_summary else None,
                    run_id,
                ),
            )
            return cur.fetchone()


def list_runs(limit: int = 20) -> list[dict[str, Any]]:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT *
                FROM ingestion_runs
                ORDER BY started_at DESC
                LIMIT %s
                """,
                (limit,),
            )
            return list(cur.fetchall())


def get_run(run_id: str) -> dict[str, Any] | None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM ingestion_runs WHERE id = %s", (run_id,))
            return cur.fetchone()
