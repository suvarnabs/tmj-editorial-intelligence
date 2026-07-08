-- Milestone 1: initial schema (sources, articles, ingestion_runs)

CREATE TABLE sources (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text NOT NULL,
    feed_url        text NOT NULL UNIQUE,
    publisher       text,
    region          text,
    language        text NOT NULL DEFAULT 'en',
    is_active       boolean NOT NULL DEFAULT true,
    last_fetched_at timestamptz,
    last_error      text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE articles (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id       uuid NOT NULL REFERENCES sources (id) ON DELETE CASCADE,
    title           text NOT NULL,
    url             text NOT NULL UNIQUE,
    author          text,
    published_at    timestamptz,
    fetched_at      timestamptz NOT NULL,
    extracted_text  text NOT NULL,
    word_count      int,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_articles_published_at ON articles (published_at DESC);
CREATE INDEX idx_articles_source_id ON articles (source_id);

CREATE TABLE ingestion_runs (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at          timestamptz NOT NULL,
    completed_at        timestamptz,
    status              text NOT NULL,
    sources_attempted   int NOT NULL DEFAULT 0,
    sources_succeeded   int NOT NULL DEFAULT 0,
    articles_fetched    int NOT NULL DEFAULT 0,
    articles_new        int NOT NULL DEFAULT 0,
    error_summary       jsonb,
    triggered_by        text
);
