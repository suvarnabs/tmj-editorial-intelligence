from app.services.ingestion.extractor import count_words, extract_text_from_html


def test_extract_text_from_html_removes_scripts_and_navigation() -> None:
    html = """
    <html>
      <body>
        <nav>Menu</nav>
        <article>
          <h1>Headline</h1>
          <p>Useful article text.</p>
          <script>alert("noise")</script>
        </article>
      </body>
    </html>
    """

    text = extract_text_from_html(html)

    assert text == "Headline Useful article text."
    assert count_words(text) == 4
