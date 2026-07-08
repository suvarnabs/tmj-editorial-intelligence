from typing import Any


def build_enrichment_messages(article: dict[str, Any], themes: list[dict[str, Any]]) -> list[dict[str, str]]:
    theme_lines = "\n".join(
        f"- {theme['slug']}: {theme['name']} - {theme.get('description') or ''}"
        for theme in themes
    )
    article_text = (article.get("extracted_text") or "")[:8000]

    user_content = f"""
Article title: {article.get("title")}
Article URL: {article.get("url")}
Published at: {article.get("published_at")}

Available TMJ editorial themes:
{theme_lines}

Article text:
{article_text}
""".strip()

    return [
        {
            "role": "system",
            "content": (
                "You enrich public RSS news articles for The Malabar Journal. "
                "Be factual, concise, and useful to editors. Choose only theme slugs "
                "from the supplied list. Return structured JSON only."
            ),
        },
        {"role": "user", "content": user_content},
    ]
