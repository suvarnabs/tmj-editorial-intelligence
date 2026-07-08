import logging

import psycopg

from app.core.config import settings

logger = logging.getLogger(__name__)


def check_database_connection() -> tuple[bool, str | None]:
    """Return (connected, error_message)."""
    try:
        with psycopg.connect(settings.database_url, connect_timeout=5) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()
        return True, None
    except Exception as exc:
        logger.exception("Database connection failed")
        return False, str(exc)
