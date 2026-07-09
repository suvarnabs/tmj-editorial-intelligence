import json
import logging
import time
from typing import Any

from openai import OpenAI

from app.core.config import settings
from app.services.brief.schema import BRIEF_JSON_SCHEMA

logger = logging.getLogger(__name__)


class OpenAIBriefClient:
    def __init__(self) -> None:
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured.")
        self.client = OpenAI(api_key=settings.openai_api_key)

    def generate(self, messages: list[dict[str, str]]) -> dict[str, Any]:
        last_error: Exception | None = None

        for attempt in range(3):
            try:
                response = self.client.chat.completions.create(
                    model=settings.openai_chat_model,
                    messages=messages,
                    response_format={
                        "type": "json_schema",
                        "json_schema": BRIEF_JSON_SCHEMA,
                    },
                    temperature=0.2,
                )
                content = response.choices[0].message.content
                if not content:
                    raise RuntimeError("OpenAI returned an empty response.")
                return json.loads(content)
            except Exception as exc:
                last_error = exc
                logger.warning("OpenAI brief attempt %s failed: %s", attempt + 1, exc)
                time.sleep(1 + attempt)

        raise RuntimeError(f"OpenAI brief generation failed: {last_error}")
