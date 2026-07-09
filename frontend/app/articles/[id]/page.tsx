import { notFound } from "next/navigation";
import { ErrorState } from "@/components/StateMessage";
import { fetchApi } from "@/lib/api";
import type { Article } from "@/lib/types";

interface ArticleDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "Not available";
}

function formatLabel(value?: string | null) {
  if (!value) return "Not available";
  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function badgeClass(value?: string | null) {
  const normalized = value?.toLowerCase();
  if (normalized === "completed" || normalized === "positive") return "badge badge-good";
  if (normalized === "pending" || normalized === "neutral") return "badge badge-neutral";
  if (normalized === "negative" || normalized === "failed") return "badge badge-alert";
  return "badge";
}

function shortId(id: string) {
  return id.length > 12 ? `${id.slice(0, 8)}...` : id;
}

function JsonBlock({ value }: { value: unknown }) {
  if (!value) {
    return <p className="muted">Not available</p>;
  }

  return <pre className="json-block">{JSON.stringify(value, null, 2)}</pre>;
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { id } = await params;
  const result = await fetchApi<Article>(`/api/v1/articles/${id}`);

  if (result.status === 404) {
    notFound();
  }

  if (!result.data) {
    return (
      <main className="container page-stack">
        <ErrorState message={`Could not load article: ${result.error}`} />
      </main>
    );
  }

  const article = result.data;

  return (
    <main className="container page-stack">
      <section className="panel">
        <span className={badgeClass(article.processing_status)}>
          {formatLabel(article.processing_status)}
        </span>
        <h1>{article.title}</h1>
        <p className="muted">Published: {formatDate(article.published_at)}</p>
        <p className="muted">
          Source: {article.source_name ?? "Source not available"}
          {!article.source_name ? (
            <span className="technical-text"> ({shortId(article.source_id)})</span>
          ) : null}
        </p>
        <a href={article.url} target="_blank" rel="noopener noreferrer">
          Open original article
        </a>
      </section>

      <section className="two-column">
        <article className="panel">
          <h2>Editorial Summary</h2>
          <p>{article.summary ?? "No summary available."}</p>
        </article>
        <article className="panel">
          <h2>Recommendation</h2>
          <div className="metric-row">
            <div>
              <span className="metric-label">Sentiment</span>
              <span className={badgeClass(article.sentiment)}>{formatLabel(article.sentiment)}</span>
            </div>
            <div>
              <span className="metric-label">Score</span>
              <span className="badge">
                {article.editorial_score === null || article.editorial_score === undefined
                  ? "Not scored"
                  : article.editorial_score}
              </span>
            </div>
            <div>
              <span className="metric-label">Coverage</span>
              <span className={badgeClass(article.coverage_recommendation)}>
                {formatLabel(article.coverage_recommendation)}
              </span>
            </div>
          </div>
        </article>
      </section>

      <section className="panel">
        <h2>Kerala Relevance</h2>
        <p>{article.kerala_relevance ?? "Not available"}</p>
      </section>

      <section className="panel">
        <h2>Recommended Angle</h2>
        <p>{article.recommended_angle ?? "Not available"}</p>
      </section>

      <section className="two-column">
        <article className="panel">
          <h2>Themes</h2>
          {article.themes && article.themes.length > 0 ? (
            <ul className="pill-list">
              {article.themes.map((theme) => (
                <li key={theme.slug}>
                  {theme.name} ({theme.confidence})
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No themes available.</p>
          )}
        </article>

        <article className="panel">
          <h2>Tags</h2>
          {article.tags && article.tags.length > 0 ? (
            <ul className="pill-list">
              {article.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">No tags available.</p>
          )}
        </article>
      </section>

      <section className="two-column">
        <article className="panel">
          <h2>Emotional Signals</h2>
          <JsonBlock value={article.emotional_signals} />
        </article>
        <article className="panel">
          <h2>Stakeholder Stance</h2>
          <JsonBlock value={article.stakeholder_stance} />
        </article>
      </section>

      <section className="panel support-panel">
        <h2>Raw Article Metadata</h2>
        <p className="muted technical-intro">Technical details retained for debugging and source tracing.</p>
        <dl className="detail-list">
          <div>
            <dt>Article ID</dt>
            <dd>
              <code>{article.id}</code>
            </dd>
          </div>
          <div>
            <dt>Author</dt>
            <dd>{article.author ?? "Not available"}</dd>
          </div>
          <div>
            <dt>Word count</dt>
            <dd>{article.word_count ?? "Not available"}</dd>
          </div>
          <div>
            <dt>Fetched at</dt>
            <dd>{formatDate(article.fetched_at)}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
