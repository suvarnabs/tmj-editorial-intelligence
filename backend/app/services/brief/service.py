from datetime import UTC, date, datetime, time, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from app.core.config import settings
from app.db.repositories import briefs
from app.services.brief.openai_client import OpenAIBriefClient
from app.services.brief.prompts import build_brief_messages


def today_in_brief_timezone() -> date:
    return datetime.now(ZoneInfo(settings.brief_timezone)).date()


def _utc_window_for_local_date(brief_date: date) -> tuple[datetime, datetime]:
    tz = ZoneInfo(settings.brief_timezone)
    start_local = datetime.combine(brief_date, time.min, tzinfo=tz)
    end_local = start_local + timedelta(days=1)
    return start_local.astimezone(UTC), end_local.astimezone(UTC)


def _select_articles(brief_date: date, limit: int) -> tuple[list[dict[str, Any]], bool, int]:
    start_utc, end_utc = _utc_window_for_local_date(brief_date)
    date_articles = briefs.list_completed_articles_for_window(
        start_utc=start_utc,
        end_utc=end_utc,
        limit=limit,
    )

    if len(date_articles) >= limit:
        return date_articles, False, len(date_articles)

    missing = limit - len(date_articles)
    fallback_articles = briefs.list_recent_completed_articles(
        limit=missing,
        exclude_ids=[str(article["id"]) for article in date_articles],
    )
    return date_articles + fallback_articles, bool(fallback_articles), len(date_articles)


def _ranked_ids_from_response(response: dict[str, Any], selected_articles: list[dict[str, Any]]) -> list[str]:
    selected_ids = [str(article["id"]) for article in selected_articles]
    ranked = [article_id for article_id in response.get("ranked_article_ids", []) if article_id in selected_ids]

    for article_id in selected_ids:
        if article_id not in ranked:
            ranked.append(article_id)

    return ranked


def generate_brief(
    *,
    brief_date: date | None = None,
    limit: int | None = None,
    client: OpenAIBriefClient | None = None,
) -> dict[str, Any]:
    target_date = brief_date or today_in_brief_timezone()
    article_limit = max(1, min(limit or settings.brief_top_n_articles, 25))
    selected_articles, used_fallback, date_window_article_count = _select_articles(
        target_date,
        article_limit,
    )

    if not selected_articles:
        raise ValueError("No completed enriched articles are available for brief generation.")

    client = client or OpenAIBriefClient()
    messages = build_brief_messages(
        brief_date=target_date,
        timezone=settings.brief_timezone,
        articles=selected_articles,
        used_fallback=used_fallback,
    )
    response = client.generate(messages)
    ranked_article_ids = _ranked_ids_from_response(response, selected_articles)

    metadata = {
        "article_count": len(selected_articles),
        "requested_limit": article_limit,
        "brief_date": target_date.isoformat(),
        "timezone": settings.brief_timezone,
        "date_window_article_count": date_window_article_count,
        "fallback_articles_used": used_fallback,
        "fallback_article_count": len(selected_articles) - date_window_article_count,
        "model": settings.openai_chat_model,
    }

    return briefs.upsert_brief(
        {
            "brief_date": target_date,
            "status": "draft",
            "headline": response["headline"],
            "executive_summary": response["executive_summary"],
            "sections": response["sections"],
            "ranked_article_ids": ranked_article_ids,
            "metadata": metadata,
        }
    )
