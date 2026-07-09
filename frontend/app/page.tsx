import Link from "next/link";
import { API_BASE_URL, fetchApi } from "@/lib/api";
import type { HealthResponse } from "@/lib/types";

const cards = [
  {
    href: "/briefs/today",
    title: "Today's Brief",
    description: "Read the latest generated editorial brief.",
  },
  {
    href: "/briefs",
    title: "Brief by Date",
    description: "Look up an existing brief for a selected date.",
  },
  {
    href: "/articles",
    title: "Articles",
    description: "Browse ingested and enriched RSS articles.",
  },
  {
    href: "/sources",
    title: "Sources",
    description: "Review configured RSS sources.",
  },
  {
    href: "/workflow",
    title: "Workflow Controls",
    description: "Run ingestion, enrichment and brief generation manually.",
  },
];

export default async function HomePage() {
  const health = await fetchApi<HealthResponse>("/health");

  return (
    <main className="container page-stack">
      <section className="hero">
        <h1>TMJ Editorial Intelligence Engine</h1>
        <p>
          Local editorial intelligence dashboard for monitoring sources, articles,
          enrichment and daily briefs.
        </p>
      </section>

      <section className="nav-card-grid" aria-label="Dashboard navigation">
        {cards.map((card) => (
          <Link className="nav-card" href={card.href} key={card.href}>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
          </Link>
        ))}
      </section>

      <section className="panel">
        <h2>Backend Health</h2>
        {health.data ? (
          <dl className="detail-list">
            <div>
              <dt>API</dt>
              <dd>{API_BASE_URL}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{health.data.status}</dd>
            </div>
            <div>
              <dt>Environment</dt>
              <dd>{health.data.environment}</dd>
            </div>
            <div>
              <dt>Database connected</dt>
              <dd>{health.data.database?.connected ? "Yes" : "No"}</dd>
            </div>
          </dl>
        ) : (
          <p className="muted">Backend health is unavailable: {health.error}</p>
        )}
      </section>
    </main>
  );
}
