-- Milestone 3: AI enrichment, editorial scoring, themes, and tags.

ALTER TABLE articles
ADD COLUMN IF NOT EXISTS processing_status text NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS processing_error text,
ADD COLUMN IF NOT EXISTS summary text,
ADD COLUMN IF NOT EXISTS sentiment text,
ADD COLUMN IF NOT EXISTS sentiment_score numeric(4,3),
ADD COLUMN IF NOT EXISTS emotional_signals jsonb,
ADD COLUMN IF NOT EXISTS stakeholder_stance jsonb,
ADD COLUMN IF NOT EXISTS suggested_story_formats jsonb,
ADD COLUMN IF NOT EXISTS kerala_relevance text,
ADD COLUMN IF NOT EXISTS editorial_score numeric(5,2),
ADD COLUMN IF NOT EXISTS coverage_recommendation text,
ADD COLUMN IF NOT EXISTS recommended_angle text;

CREATE INDEX IF NOT EXISTS idx_articles_processing_status
ON articles (processing_status);

CREATE INDEX IF NOT EXISTS idx_articles_editorial_score
ON articles (editorial_score DESC);

CREATE TABLE IF NOT EXISTS editorial_themes (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        text NOT NULL UNIQUE,
    name        text NOT NULL,
    description text,
    sort_order  int NOT NULL DEFAULT 0,
    is_active   boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS article_themes (
    article_id uuid NOT NULL REFERENCES articles (id) ON DELETE CASCADE,
    theme_id   uuid NOT NULL REFERENCES editorial_themes (id) ON DELETE CASCADE,
    confidence numeric(4,3) NOT NULL DEFAULT 0,
    PRIMARY KEY (article_id, theme_id)
);

CREATE TABLE IF NOT EXISTS article_tags (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id uuid NOT NULL REFERENCES articles (id) ON DELETE CASCADE,
    tag        text NOT NULL,
    UNIQUE (article_id, tag)
);

INSERT INTO editorial_themes (slug, name, description, sort_order, is_active)
VALUES
    ('kerala-politics', 'Kerala Politics & Governance', 'Politics, policy, governance, parties, elections, administration and public institutions in Kerala.', 10, true),
    ('kerala-economy', 'Kerala Economy & Business', 'Business, labour, remittances, tourism, infrastructure, public finance and economic development connected to Kerala.', 20, true),
    ('diaspora', 'Malayali Diaspora', 'Issues affecting Malayalis outside Kerala, including Gulf migration, remittances, identity, labour and community life.', 30, true),
    ('culture-society', 'Culture, Society & Lifestyle', 'Culture, media, social change, religion, caste, gender, family, lifestyle and civic life.', 40, true),
    ('environment-climate', 'Environment & Climate', 'Climate, ecology, disasters, conservation, pollution, land use, coasts, forests and sustainability.', 50, true),
    ('education-health', 'Education & Health', 'Schools, universities, public health, hospitals, medical policy and social welfare.', 60, true),
    ('national-impact', 'National Events Affecting Kerala', 'Indian national developments with meaningful implications for Kerala or Malayali audiences.', 70, true),
    ('technology-innovation', 'Technology & Innovation', 'Technology, startups, science, digital governance, innovation and internet policy.', 80, true),
    ('sports-entertainment', 'Sports & Entertainment', 'Sports, cinema, music, celebrity, arts and entertainment with relevance to TMJ audiences.', 90, true)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active;
