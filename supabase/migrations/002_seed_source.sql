-- Milestone 1: one placeholder RSS source
-- Replace feed_url with a real public RSS URL before Milestone 2 ingestion.

INSERT INTO sources (name, feed_url, publisher, region, language, is_active)
VALUES (
    'Placeholder News Source',
    'https://example.com/placeholder-rss-feed.xml',
    'Placeholder Publisher',
    'kerala',
    'en',
    true
);
