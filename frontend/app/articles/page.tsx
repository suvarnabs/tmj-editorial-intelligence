import Link from "next/link";
import { EmptyState, ErrorState } from "@/components/StateMessage";
import { fetchApi } from "@/lib/api";
import type { Article } from "@/lib/types";

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Not available";
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

function formatScore(value?: number | null) {
  return value === null || value === undefined ? "Not scored" : value.toFixed(1);
}

function badgeClass(value?: string | null) {
  const normalized = value?.toLowerCase();
  if (normalized === "completed" || normalized === "positive") return "badge badge-good";
  if (normalized === "pending" || normalized === "neutral") return "badge badge-neutral";
  if (normalized === "negative" || normalized === "failed") return "badge badge-alert";
  return "badge";
}

function BadgeValue({ value, fallback }: { value?: string | null; fallback: string }) {
  const label = value ? formatLabel(value) : fallback;
  return <span className={badgeClass(value ?? fallback)}>{label}</span>;
}

export default async function ArticlesPage() {
  const result = await fetchApi<Article[]>("/api/v1/articles?limit=100");

  return (
    <main className="container page-stack">
      <div className="page-heading">
        <h1>Articles</h1>
        <p>Browse ingested RSS articles and enrichment fields.</p>
      </div>

      {!result.data ? (
        <ErrorState message={`Could not load articles: ${result.error}`} />
      ) : result.data.length === 0 ? (
        <EmptyState message="No articles found. Run RSS ingestion first." />
      ) : (
        <section className="panel table-wrap articles-table">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Published</th>
                <th>Sentiment</th>
                <th>Relevance</th>
                <th>Score</th>
                <th>Coverage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((article) => (
                <tr key={article.id}>
                  <td className="article-title-cell">
                    <Link href={`/articles/${article.id}`}>{article.title}</Link>
                    <div className="table-subtext">Article ID: {article.id.slice(0, 8)}...</div>
                  </td>
                  <td>{formatDate(article.published_at)}</td>
                  <td>
                    <BadgeValue value={article.sentiment} fallback="Not enriched" />
                  </td>
                  <td className="relevance-cell">{article.kerala_relevance ?? "Not available"}</td>
                  <td>
                    <span className="badge">{formatScore(article.editorial_score)}</span>
                  </td>
                  <td>
                    <BadgeValue value={article.coverage_recommendation} fallback="Not available" />
                  </td>
                  <td>
                    <BadgeValue value={article.processing_status} fallback="Not available" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
