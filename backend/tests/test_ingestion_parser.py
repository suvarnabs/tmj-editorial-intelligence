from app.services.ingestion.parser import parse_feed


def test_parse_feed_returns_basic_entries() -> None:
    xml = """
    <rss version="2.0">
      <channel>
        <title>Test Feed</title>
        <item>
          <title>First story</title>
          <link>https://example.com/first</link>
          <author>Reporter</author>
          <pubDate>Wed, 08 Jul 2026 04:00:00 GMT</pubDate>
          <description><![CDATA[<p>Short summary</p>]]></description>
        </item>
      </channel>
    </rss>
    """

    entries = parse_feed(xml, limit=10)

    assert len(entries) == 1
    assert entries[0].title == "First story"
    assert entries[0].url == "https://example.com/first"
    assert entries[0].author == "Reporter"
    assert entries[0].summary == "<p>Short summary</p>"
