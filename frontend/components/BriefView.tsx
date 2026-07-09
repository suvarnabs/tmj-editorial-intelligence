import Link from "next/link";

import type { Brief, RankedArticle } from "@/lib/types";

type BriefRecord = Record<string, unknown>;

const SECTION_TITLES: Record<string, string> = {
  what_happened: "What Happened",
  why_it_matters: "Why It Matters",
  sentiment_landscape: "Sentiment Landscape",
  tmj_angle: "TMJ Angle",
  coverage_recommendations: "Coverage Recommendations",
};

const METADATA_LABELS: Record<string, string> = {
  model: "Model",
  timezone: "Timezone",
  brief_date: "Brief Date",
  article_count: "Article Count",
  requested_limit: "Requested Limit",
  fallback_articles_used: "Fallback Articles Used",
  fallback_article_count: "Fallback Article Count",
  date_window_article_count: "Date Window Article Count",
};

function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => (word.toLowerCase() === "tmj" ? "TMJ" : word[0].toUpperCase() + word.slice(1)))
    .join(" ");
}

function shortId(id: string) {
  return id.length > 12 ? `${id.slice(0, 8)}...` : id;
}

function readableValue(value: unknown): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (value === null || value === undefined || value === "") return "Not available";
  return String(value);
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Not available";
}

function formatLabel(value?: string | null) {
  if (!value) return "Not available";
  return titleCase(value);
}

function formatScore(value?: number | null) {
  return value === null || value === undefined ? "Not scored" : value.toFixed(1);
}

function asRecord(value: unknown): BriefRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as BriefRecord)
    : {};
}

function getText(item: BriefRecord) {
  const value = item.text ?? item.narrative ?? item.rationale ?? item.summary;
  return readableValue(value);
}

function ArticleTechnicalId({ id }: { id: unknown }) {
  if (!id) return null;
  return <div className="technical-text">Article ref: {shortId(String(id))}</div>;
}

function GenericArticleItems({ items }: { items: unknown[] }) {
  if (items.length === 0) {
    return <p className="muted">No items recorded.</p>;
  }

  return (
    <div className="brief-item-list">
      {items.map((rawItem, index) => {
        const item = asRecord(rawItem);
        return (
          <article className="brief-item" key={index}>
            <p>{getText(item)}</p>
            {item.title ? <p className="related-article">Related article: {String(item.title)}</p> : null}
            <ArticleTechnicalId id={item.article_id} />
          </article>
        );
      })}
    </div>
  );
}

function SentimentLandscape({ value }: { value: unknown }) {
  const section = asRecord(value);

  return (
    <div className="brief-item">
      <p>{readableValue(section.narrative)}</p>
      {section.dominant_sentiment ? (
        <span className="badge badge-neutral">
          Dominant sentiment: {readableValue(section.dominant_sentiment)}
        </span>
      ) : null}
    </div>
  );
}

function CoverageRecommendations({ value }: { value: unknown }) {
  const items = Array.isArray(value) ? value : [];

  if (items.length === 0) {
    return <p className="muted">No coverage recommendations recorded.</p>;
  }

  return (
    <div className="brief-item-list">
      {items.map((rawItem, index) => {
        const item = asRecord(rawItem);
        return (
          <article className="brief-item" key={index}>
            <h4>{readableValue(item.title)}</h4>
            <p>{readableValue(item.rationale)}</p>
            <span className="badge badge-coverage">
              Recommendation: {titleCase(readableValue(item.recommendation))}
            </span>
            <ArticleTechnicalId id={item.article_id} />
          </article>
        );
      })}
    </div>
  );
}

function BriefSection({ name, value }: { name: string; value: unknown }) {
  const title = SECTION_TITLES[name] ?? titleCase(name);

  return (
    <article className="subpanel brief-section">
      <h3>{title}</h3>
      {name === "sentiment_landscape" ? (
        <SentimentLandscape value={value} />
      ) : name === "coverage_recommendations" ? (
        <CoverageRecommendations value={value} />
      ) : Array.isArray(value) ? (
        <GenericArticleItems items={value} />
      ) : (
        <p>{readableValue(value)}</p>
      )}
    </article>
  );
}

function Metadata({ metadata }: { metadata: Brief["metadata"] }) {
  if (!metadata) {
    return <p className="muted">No metadata recorded.</p>;
  }

  return (
    <dl className="metadata-list">
      {Object.entries(metadata).map(([key, value]) => (
        <div key={key}>
          <dt>{METADATA_LABELS[key] ?? titleCase(key)}</dt>
          <dd>{readableValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function RankedArticleItem({
  article,
  fallbackId,
}: {
  article?: RankedArticle | null;
  fallbackId?: string;
}) {
  const id = article?.id ?? fallbackId;
  const title = article?.title || "Article not found";

  return (
    <li className="ranked-article-item">
      <div>
        {id && article?.title ? (
          <Link className="ranked-article-title" href={`/articles/${id}`}>
            {title}
          </Link>
        ) : (
          <span className="ranked-article-title">{title}</span>
        )}
        <div className="table-subtext">
          {article?.source_name ? `${article.source_name} · ` : ""}
          {article?.published_at ? formatDate(article.published_at) : "Published date not available"}
        </div>
      </div>

      <div className="ranked-article-meta">
        <span className="badge">Score: {formatScore(article?.editorial_score)}</span>
        <span className="badge badge-coverage">
          Coverage: {formatLabel(article?.coverage_recommendation)}
        </span>
        <span className="badge badge-neutral">
          Status: {formatLabel(article?.processing_status)}
        </span>
      </div>

      <div className="ranked-article-links">
        {id ? <Link href={`/articles/${id}`}>Open detail</Link> : null}
        {article?.url ? (
          <a href={article.url} target="_blank" rel="noopener noreferrer">
            Original article
          </a>
        ) : null}
      </div>

      {id ? <ArticleTechnicalId id={id} /> : null}
    </li>
  );
}

export function BriefView({ brief }: { brief: Brief }) {
  return (
    <div className="page-stack">
      <section className="panel">
        <div className="eyebrow">{brief.brief_date}</div>
        <h1>{brief.headline || "Untitled brief"}</h1>
        <p className="lead">{brief.executive_summary || "No executive summary available."}</p>
      </section>

      <section className="panel">
        <h2>Editorial Brief</h2>
        <div className="section-grid">
          {Object.entries(brief.sections ?? {}).map(([key, value]) => (
            <BriefSection key={key} name={key} value={value} />
          ))}
        </div>
      </section>

      <section className="two-column support-section">
        <article className="panel support-panel">
          <h2>Ranked Articles</h2>
          {brief.ranked_articles && brief.ranked_articles.length > 0 ? (
            <ol className="ranked-list">
              {brief.ranked_articles.map((article, index) => (
                <RankedArticleItem
                  article={article}
                  fallbackId={brief.ranked_article_ids?.[index]}
                  key={article?.id ?? brief.ranked_article_ids?.[index] ?? index}
                />
              ))}
            </ol>
          ) : brief.ranked_article_ids && brief.ranked_article_ids.length > 0 ? (
            <ol className="ranked-list">
              {brief.ranked_article_ids.map((id) => (
                <RankedArticleItem fallbackId={id} key={id} />
              ))}
            </ol>
          ) : (
            <p className="muted">No ranked articles recorded.</p>
          )}
        </article>

        <article className="panel support-panel">
          <h2>System Metadata</h2>
          <Metadata metadata={brief.metadata} />
        </article>
      </section>
    </div>
  );
}
