-- Milestone 4: daily editorial brief generation.

CREATE TABLE IF NOT EXISTS editorial_briefs (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    brief_date         date NOT NULL UNIQUE,
    generated_at       timestamptz NOT NULL,
    status             text NOT NULL DEFAULT 'draft',
    headline           text,
    executive_summary  text,
    sections           jsonb NOT NULL,
    ranked_article_ids uuid[],
    metadata           jsonb,
    created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_editorial_briefs_generated_at
ON editorial_briefs (generated_at DESC);
