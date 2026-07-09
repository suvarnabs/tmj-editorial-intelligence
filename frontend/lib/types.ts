export interface HealthResponse {
  status: string;
  environment: string;
  database?: {
    connected: boolean;
    error?: string | null;
  };
}

export interface IngestionRun {
  id: string;
  started_at: string;
  completed_at?: string | null;
  status: string;
  sources_attempted: number;
  sources_succeeded: number;
  articles_fetched: number;
  articles_new: number;
  error_summary?: Record<string, unknown> | Record<string, unknown>[] | null;
  triggered_by?: string | null;
}

export interface EnrichmentRunResponse {
  status: string;
  attempted: number;
  completed: number;
  failed: number;
  errors: Record<string, unknown>[];
}

export interface EnrichmentStatusResponse {
  counts: Record<string, number>;
}

export interface Brief {
  id: string;
  brief_date: string;
  generated_at: string;
  status: string;
  headline?: string | null;
  executive_summary?: string | null;
  sections: Record<string, unknown>;
  ranked_article_ids?: string[] | null;
  ranked_articles?: RankedArticle[] | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface RankedArticle {
  id: string;
  title?: string | null;
  url?: string | null;
  source_name?: string | null;
  published_at?: string | null;
  editorial_score?: number | null;
  coverage_recommendation?: string | null;
  processing_status?: string | null;
}

export interface ArticleTheme {
  slug: string;
  name: string;
  confidence: number;
}

export interface Article {
  id: string;
  source_id: string;
  source_name?: string | null;
  source_type?: string | null;
  source_publisher?: string | null;
  title: string;
  url: string;
  author?: string | null;
  published_at?: string | null;
  fetched_at: string;
  extracted_text?: string;
  word_count?: number | null;
  raw_html?: string | null;
  processing_status?: string | null;
  processing_error?: string | null;
  summary?: string | null;
  sentiment?: string | null;
  sentiment_score?: number | null;
  emotional_signals?: Record<string, unknown> | null;
  stakeholder_stance?: Record<string, unknown> | null;
  suggested_story_formats?: string[] | null;
  kerala_relevance?: string | null;
  editorial_score?: number | null;
  coverage_recommendation?: string | null;
  recommended_angle?: string | null;
  themes?: ArticleTheme[] | null;
  tags?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Source {
  id: string;
  name: string;
  source_type: string;
  feed_url: string;
  publisher?: string | null;
  region?: string | null;
  language: string;
  is_active: boolean;
  notes?: string | null;
  last_fetched_at?: string | null;
  last_error?: string | null;
  created_at: string;
  updated_at: string;
}
