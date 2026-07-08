import logging
from typing import Any

from app.core.config import settings
from app.db.repositories import articles, themes
from app.services.enrichment.openai_client import OpenAIEnrichmentClient
from app.services.enrichment.prompts import build_enrichment_messages
from app.services.enrichment.scoring import calculate_editorial_score

logger = logging.getLogger(__name__)


def _valid_theme_matches(raw_matches: list[dict[str, Any]], theme_map: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    valid = []
    for match in raw_matches:
        slug = match.get("slug")
        if slug in theme_map:
            valid.append(
                {
                    "slug": slug,
                    "confidence": max(0, min(float(match.get("confidence", 0)), 1)),
                }
            )
    return valid


def enrich_article(article: dict[str, Any], client: OpenAIEnrichmentClient | None = None) -> dict[str, Any]:
    article_id = str(article["id"])
    active_themes = themes.list_themes(active=True)
    theme_map = {theme["slug"]: theme for theme in active_themes}
    client = client or OpenAIEnrichmentClient()

    articles.mark_processing(article_id)

    try:
        messages = build_enrichment_messages(article, active_themes)
        enriched = client.enrich(messages)
        editorial_score = calculate_editorial_score(enriched["scoring_inputs"])
        theme_matches = _valid_theme_matches(enriched.get("themes", []), theme_map)
        if not theme_matches and active_themes:
            theme_matches = [{"slug": active_themes[0]["slug"], "confidence": 0}]

        saved = articles.save_enrichment(article_id, enriched, editorial_score)
        themes.replace_article_themes(article_id, theme_matches)
        themes.replace_article_tags(article_id, enriched.get("tags", []))
        return saved
    except Exception as exc:
        logger.exception("Article enrichment failed for article %s", article_id)
        articles.mark_failed(article_id, str(exc))
        raise


def run_enrichment(limit: int | None = None) -> dict[str, Any]:
    batch_size = limit or settings.enrichment_batch_size
    batch_size = max(1, min(batch_size, 25))
    pending_articles = articles.list_pending_for_enrichment(batch_size)
    client = OpenAIEnrichmentClient()

    completed = 0
    failed = 0
    errors: list[dict[str, Any]] = []

    for article in pending_articles:
        try:
            enrich_article(article, client=client)
            completed += 1
        except Exception as exc:
            failed += 1
            errors.append({"article_id": str(article["id"]), "error": str(exc)[:1000]})

    return {
        "status": "completed" if failed == 0 else "partial",
        "attempted": len(pending_articles),
        "completed": completed,
        "failed": failed,
        "errors": errors,
    }


def reprocess_article(article_id: str) -> dict[str, Any]:
    article = articles.reset_for_reprocessing(article_id)
    if not article:
        raise ValueError("Article not found.")
    return enrich_article(article)
