import Link from "next/link";
import { EmptyState, ErrorState } from "@/components/StateMessage";
import { fetchApi } from "@/lib/api";
import type { Article } from "@/lib/types";

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "Not available";
}

function formatScore(value?: number | null) {
  return value === null || value === undefined ? "Not scored" : value.toFixed(1);
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
        <section className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Source</th>
                <th>Published</th>
                <th>Sentiment</th>
                <th>Kerala relevance</th>
                <th>Score</th>
                <th>Coverage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((article) => (
                <tr key={article.id}>
                  <td>
                    <Link href={`/articles/${article.id}`}>{article.title}</Link>
                  </td>
                  <td>
                    <code>{article.source_id}</code>
                  </td>
                  <td>{formatDate(article.published_at)}</td>
                  <td>{article.sentiment ?? "Not enriched"}</td>
                  <td className="clip-text">{article.kerala_relevance ?? "Not available"}</td>
                  <td>{formatScore(article.editorial_score)}</td>
                  <td>{article.coverage_recommendation ?? "Not available"}</td>
                  <td>{article.processing_status ?? "unknown"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
