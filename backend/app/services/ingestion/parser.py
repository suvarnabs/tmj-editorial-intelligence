from dataclasses import dataclass
from datetime import UTC, datetime
from time import struct_time
from typing import Any

import feedparser


@dataclass(frozen=True)
class FeedEntry:
    title: str
    url: str
    author: str | None
    published_at: datetime | None
    summary: str | None


def _parsed_time_to_datetime(value: struct_time | None) -> datetime | None:
    if not value:
        return None
    return datetime(*value[:6], tzinfo=UTC)


def _entry_summary(entry: Any) -> str | None:
    if entry.get("summary"):
        return entry.get("summary")

    content = entry.get("content")
    if content and isinstance(content, list):
        first = content[0]
        if isinstance(first, dict):
            return first.get("value")

    return None


def parse_feed(xml: str, *, limit: int) -> list[FeedEntry]:
    parsed = feedparser.parse(xml)
    entries: list[FeedEntry] = []

    for entry in parsed.entries[:limit]:
        url = entry.get("link")
        title = entry.get("title")
        if not url or not title:
            continue

        published_at = _parsed_time_to_datetime(
            entry.get("published_parsed") or entry.get("updated_parsed")
        )

        entries.append(
            FeedEntry(
                title=title.strip(),
                url=url.strip(),
                author=entry.get("author"),
                published_at=published_at,
                summary=_entry_summary(entry),
            )
        )

    return entries
