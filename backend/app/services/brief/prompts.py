from datetime import date
from typing import Any


def _article_payload(article: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(article["id"]),
        "title": article.get("title"),
        "url": article.get("url"),
        "published_at": str(article.get("published_at")),
        "summary": article.get("summary"),
        "sentiment": article.get("sentiment"),
        "sentiment_score": float(article["sentiment_score"]) if article.get("sentiment_score") is not None else None,
        "kerala_relevance": article.get("kerala_relevance"),
        "recommended_angle": article.get("recommended_angle"),
        "coverage_recommendation": article.get("coverage_recommendation"),
        "editorial_score": float(article["editorial_score"]) if article.get("editorial_score") is not None else None,
        "suggested_story_formats": article.get("suggested_story_formats"),
    }


def build_brief_messages(
    *,
    brief_date: date,
    timezone: str,
    articles: list[dict[str, Any]],
    used_fallback: bool,
) -> list[dict[str, str]]:
    article_lines = "\n".join(str(_article_payload(article)) for article in articles)
    fallback_note = (
        "Some articles are fallback recent completed articles outside the target date."
        if used_fallback
        else "All articles are from the target date window."
    )

    user_content = f"""
Brief date: {brief_date}
Timezone: {timezone}
Selection note: {fallback_note}

Use only the supplied enriched articles. Rank them for TMJ editors and answer:
1. What happened?
2. Why does it matter to Kerala, India, diaspora or TMJ audiences?
3. What is the dominant media and public sentiment?
4. What unique angle can TMJ add?
5. Should TMJ cover it today, this week, or monitor it?

Articles:
{article_lines}
""".strip()

    return [
        {
            "role": "system",
            "content": (
                "You generate concise daily editorial briefs for The Malabar Journal. "
                "Use only provided enriched article data. Do not invent sources. "
                "Return structured JSON only."
            ),
        },
        {"role": "user", "content": user_content},
    ]
