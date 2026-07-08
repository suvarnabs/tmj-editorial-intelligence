import logging

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.client import check_database_connection

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check() -> JSONResponse:
    db_connected, db_error = check_database_connection()

    body = {
        "status": "ok" if db_connected else "degraded",
        "environment": settings.environment,
        "database": {
            "connected": db_connected,
            "error": db_error,
        },
    }

    if db_connected:
        return JSONResponse(status_code=status.HTTP_200_OK, content=body)

    return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content=body)
