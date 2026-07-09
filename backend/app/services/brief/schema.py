BRIEF_JSON_SCHEMA = {
    "name": "tmj_daily_editorial_brief",
    "strict": True,
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "headline": {"type": "string"},
            "executive_summary": {"type": "string"},
            "sections": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "what_happened": {
                        "type": "array",
                        "items": {"$ref": "#/$defs/article_section_item"},
                    },
                    "why_it_matters": {
                        "type": "array",
                        "items": {"$ref": "#/$defs/article_section_item"},
                    },
                    "sentiment_landscape": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "dominant_sentiment": {"type": "string"},
                            "narrative": {"type": "string"},
                        },
                        "required": ["dominant_sentiment", "narrative"],
                    },
                    "tmj_angle": {
                        "type": "array",
                        "items": {"$ref": "#/$defs/article_section_item"},
                    },
                    "coverage_recommendations": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "properties": {
                                "article_id": {"type": "string"},
                                "title": {"type": "string"},
                                "recommendation": {
                                    "type": "string",
                                    "enum": ["today", "this_week", "monitor", "skip"],
                                },
                                "rationale": {"type": "string"},
                            },
                            "required": ["article_id", "title", "recommendation", "rationale"],
                        },
                    },
                },
                "required": [
                    "what_happened",
                    "why_it_matters",
                    "sentiment_landscape",
                    "tmj_angle",
                    "coverage_recommendations",
                ],
            },
            "ranked_article_ids": {
                "type": "array",
                "items": {"type": "string"},
            },
        },
        "required": ["headline", "executive_summary", "sections", "ranked_article_ids"],
        "$defs": {
            "article_section_item": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "article_id": {"type": "string"},
                    "title": {"type": "string"},
                    "text": {"type": "string"},
                },
                "required": ["article_id", "title", "text"],
            }
        },
    },
}
