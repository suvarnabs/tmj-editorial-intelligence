import logging
from typing import Any

from app.core.config import settings
from app.db.repositories import articles, ingestion_runs, sources
from app.services.ingestion.extractor import count_words, extract_text_from_html
from app.services.ingestion.fetcher import fetch_url
from app.services.ingestion.parser import FeedEntry, parse_feed

logger = logging.getLogger(__name__)


def _fallback_text(entry: FeedEntry) -> str:
    if entry.summary:
        return extract_text_from_html(entry.summary)
    return entry.title


def _raw_html_for_storage(html: str) -> str:
    max_chars = 200_000
    return html[:max_chars]


def _ingest_entry(source_id: str, entry: FeedEntry) -> dict[str, Any] | None:
    raw_html: str | None = None
    extracted_text = ""

    try:
        raw_html = fetch_url(entry.url)
        extracted_text = extract_text_from_html(raw_html)
    except Exception as exc:
        logger.info("Article page fetch failed for %s: %s", entry.url, exc)
        extracted_text = _fallback_text(entry)

    if not extracted_text:
        extracted_text = entry.title

    return articles.insert_article(
        {
            "source_id": source_id,
            "title": entry.title,
            "url": entry.url,
            "author": entry.author,
            "published_at": entry.published_at,
            "extracted_text": extracted_text,
            "word_count": count_words(extracted_text),
            "raw_html": _raw_html_for_storage(raw_html) if raw_html else None,
        }
    )


def run_ingestion() -> dict[str, Any]:
    run = ingestion_runs.create_run(triggered_by="manual")
    run_id = str(run["id"])

    active_sources = sources.list_sources(active=True)
    sources_attempted = len(active_sources)
    sources_succeeded = 0
    articles_fetched = 0
    articles_new = 0
    errors: list[dict[str, Any]] = []

    for source in active_sources:
        source_id = str(source["id"])
        try:
            feed_xml = fetch_url(source["feed_url"])
            entries = parse_feed(feed_xml, limit=settings.ingestion_max_articles_per_source)
            articles_fetched += len(entries)

            for entry in entries:
                inserted = _ingest_entry(source_id, entry)
                if inserted:
                    articles_new += 1

            sources.mark_source_success(source_id)
            sources_succeeded += 1
        except Exception as exc:
            message = str(exc)
            logger.exception("Ingestion failed for source %s", source_id)
            sources.mark_source_error(source_id, message)
            errors.append(
                {
                    "source_id": source_id,
                    "source_name": source.get("name"),
                    "error": message[:1000],
                }
            )

    if sources_attempted == 0:
        status = "completed"
    elif sources_succeeded == sources_attempted:
        status = "completed"
    elif sources_succeeded > 0:
        status = "partial"
    else:
        status = "failed"

    return ingestion_runs.complete_run(
        run_id,
        status=status,
        sources_attempted=sources_attempted,
        sources_succeeded=sources_succeeded,
        articles_fetched=articles_fetched,
        articles_new=articles_new,
        error_summary=errors,
    )
