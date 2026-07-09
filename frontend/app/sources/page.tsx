import { EmptyState, ErrorState } from "@/components/StateMessage";
import { fetchApi } from "@/lib/api";
import type { Source } from "@/lib/types";

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "Not available";
}

export default async function SourcesPage() {
  const result = await fetchApi<Source[]>("/api/v1/sources");

  return (
    <main className="container page-stack">
      <div className="page-heading">
        <h1>Sources</h1>
        <p>Read-only view of configured RSS sources.</p>
      </div>

      {!result.data ? (
        <ErrorState message={`Could not load sources: ${result.error}`} />
      ) : result.data.length === 0 ? (
        <EmptyState message="No sources found." />
      ) : (
        <section className="card-grid">
          {result.data.map((source) => (
            <article className="panel" key={source.id}>
              <div className="eyebrow">{source.is_active ? "active" : "inactive"}</div>
              <h2>{source.name}</h2>
              <dl className="detail-list">
                <div>
                  <dt>Source type</dt>
                  <dd>RSS feed</dd>
                </div>
                <div>
                  <dt>Feed URL</dt>
                  <dd>
                    <a href={source.feed_url} target="_blank" rel="noopener noreferrer">
                      {source.feed_url}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt>Publisher</dt>
                  <dd>{source.publisher ?? "Not available"}</dd>
                </div>
                <div>
                  <dt>Region</dt>
                  <dd>{source.region ?? "Not available"}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatDate(source.created_at)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
