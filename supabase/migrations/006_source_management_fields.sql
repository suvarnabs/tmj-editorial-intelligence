-- Milestone 7: source management fields for local dashboard editing.

ALTER TABLE sources
ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'rss',
ADD COLUMN IF NOT EXISTS notes text;
