import httpx


USER_AGENT = "TMJEditorialIntelligence/0.1 (+local-rss-ingestion)"


def fetch_url(url: str, *, timeout_seconds: float = 15.0) -> str:
    headers = {"User-Agent": USER_AGENT}
    last_error: Exception | None = None

    for _ in range(2):
        try:
            with httpx.Client(timeout=timeout_seconds, follow_redirects=True, headers=headers) as client:
                response = client.get(url)
                response.raise_for_status()
                return response.text
        except Exception as exc:
            last_error = exc

    raise RuntimeError(f"Could not fetch {url}: {last_error}")
