import type { Brief } from "@/lib/types";

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
  return <div className="technical-text">Article ID: {shortId(String(id))}</div>;
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
          {brief.ranked_article_ids && brief.ranked_article_ids.length > 0 ? (
            <ol className="ranked-list">
              {brief.ranked_article_ids.map((id) => (
                <li key={id}>
                  <span>Article ID: {shortId(id)}</span>
                </li>
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
