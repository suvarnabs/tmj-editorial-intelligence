from fastapi import Header, HTTPException, status

from app.core.config import settings


def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    if not settings.api_secret_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="API_SECRET_KEY is not configured.",
        )

    if not x_api_key or x_api_key != settings.api_secret_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Valid X-API-Key header required.",
        )
