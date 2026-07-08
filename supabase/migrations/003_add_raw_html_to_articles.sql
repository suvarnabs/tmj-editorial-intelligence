-- Milestone 2: optionally store fetched article HTML for local ingestion debugging.

ALTER TABLE articles
ADD COLUMN IF NOT EXISTS raw_html text;
