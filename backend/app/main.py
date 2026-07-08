import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health
from app.core.config import settings
from app.core.logging import setup_logging

setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title="TMJ Editorial Intelligence API",
    version="0.1.0",
    description="Internal newsroom intelligence platform for The Malabar Journal.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)


@app.on_event("startup")
def on_startup() -> None:
    logger.info("Starting TMJ Editorial Intelligence API (%s)", settings.environment)
