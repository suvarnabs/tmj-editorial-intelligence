from bs4 import BeautifulSoup


def extract_text_from_html(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")

    for element in soup(["script", "style", "noscript", "header", "footer", "nav"]):
        element.decompose()

    article = soup.find("article")
    source = article if article else soup.body if soup.body else soup
    text = source.get_text(separator=" ", strip=True)
    return " ".join(text.split())


def count_words(text: str) -> int:
    return len([word for word in text.split() if word.strip()])
