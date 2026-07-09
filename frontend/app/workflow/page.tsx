"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import {
  API_BASE_URL,
  fetchApi,
  generateBrief,
  runEnrichment,
  runIngestion,
  type ApiResult,
} from "@/lib/api";
import type {
  Brief,
  EnrichmentRunResponse,
  EnrichmentStatusResponse,
  HealthResponse,
  IngestionRun,
} from "@/lib/types";

type ActionKey = "ingestion" | "enrichment" | "brief";

type ActionState<T> = {
  loading: boolean;
  result: ApiResult<T> | null;
};

const emptyAction = { loading: false, result: null };

function clampLimit(value: number) {
  if (Number.isNaN(value)) {
    return 3;
  }
  return Math.max(1, Math.min(value, 25));
}

function friendlyError(action: ActionKey, error: string) {
  const prefix = {
    ingestion: "Ingestion failed. Check that the backend is running and the RSS sources are configured.",
    enrichment:
      "Enrichment failed. Check that the backend is running and the OpenAI API key is configured.",
    brief:
      "Brief generation failed. Check that enriched articles are available and the backend is running.",
  }[action];

  return `${prefix} Backend message: ${error}`;
}

function RawResponse({ value }: { value: unknown }) {
  return (
    <details className="technical-details">
      <summary>Raw response</summary>
      <pre className="json-block">{JSON.stringify(value, null, 2)}</pre>
    </details>
  );
}

function ActionResult<T>({
  action,
  result,
  children,
}: {
  action: ActionKey;
  result: ApiResult<T> | null;
  children: (data: T) => ReactNode;
}) {
  if (!result) {
    return null;
  }

  if (result.error) {
    return <div className="state-box error">{friendlyError(action, result.error)}</div>;
  }

  if (result.data === null) {
    return null;
  }

  return (
    <div className="state-box success">
      {children(result.data)}
      <RawResponse value={result.data} />
    </div>
  );
}

export default function WorkflowPage() {
  const [enrichmentLimit, setEnrichmentLimit] = useState(3);
  const [briefLimit, setBriefLimit] = useState(3);
  const [health, setHealth] = useState<ApiResult<HealthResponse> | null>(null);
  const [enrichmentStatus, setEnrichmentStatus] =
    useState<ApiResult<EnrichmentStatusResponse> | null>(null);
  const [actions, setActions] = useState<{
    ingestion: ActionState<IngestionRun>;
    enrichment: ActionState<EnrichmentRunResponse>;
    brief: ActionState<Brief>;
  }>({
    ingestion: emptyAction,
    enrichment: emptyAction,
    brief: emptyAction,
  });

  async function refreshStatus() {
    const [healthResult, enrichmentResult] = await Promise.all([
      fetchApi<HealthResponse>("/health"),
      fetchApi<EnrichmentStatusResponse>("/api/v1/enrichment/status"),
    ]);
    setHealth(healthResult);
    setEnrichmentStatus(enrichmentResult);
  }

  useEffect(() => {
    refreshStatus();
  }, []);

  async function runAction<T>(key: ActionKey, request: () => Promise<ApiResult<T>>) {
    setActions((current) => ({
      ...current,
      [key]: { loading: true, result: null },
    }));

    const result = await request();

    setActions((current) => ({
      ...current,
      [key]: { loading: false, result },
    }));

    await refreshStatus();
  }

  const healthOnline = health?.data?.status === "ok";
  const statusCounts = enrichmentStatus?.data?.counts ?? {};

  return (
    <main className="container page-stack">
      <section className="page-heading">
        <p className="eyebrow">Manual workflow</p>
        <h1>Workflow Controls</h1>
        <p>Run ingestion, enrichment and brief generation from the browser.</p>
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <h2>Status</h2>
            <p className="muted">Local backend and workflow readiness.</p>
          </div>
          <button type="button" className="secondary-button" onClick={refreshStatus}>
            Refresh
          </button>
        </div>

        <div className="status-grid">
          <div className="subpanel">
            <span className={healthOnline ? "badge badge-good" : "badge badge-alert"}>
              {healthOnline ? "Backend online" : "Backend unavailable"}
            </span>
            <dl className="detail-list status-detail-list">
              <div>
                <dt>API</dt>
                <dd>{API_BASE_URL}</dd>
              </div>
              <div>
                <dt>Database</dt>
                <dd>{health?.data?.database?.connected ? "Connected" : "Unavailable"}</dd>
              </div>
            </dl>
            {health?.error ? <p className="muted">{health.error}</p> : null}
          </div>

          <div className="subpanel">
            <h3>Enrichment Queue</h3>
            {enrichmentStatus?.error ? (
              <p className="muted">{enrichmentStatus.error}</p>
            ) : (
              <dl className="metadata-list">
                {Object.entries(statusCounts).map(([label, count]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{count}</dd>
                  </div>
                ))}
                {Object.keys(statusCounts).length === 0 ? (
                  <div>
                    <dt>Status</dt>
                    <dd>Loading</dd>
                  </div>
                ) : null}
              </dl>
            )}
          </div>

          <div className="subpanel quick-links">
            <h3>Open Views</h3>
            <Link href="/briefs/today">Today&apos;s Brief</Link>
            <Link href="/articles">Articles</Link>
          </div>
        </div>
      </section>

      <section className="card-grid">
        <article className="panel workflow-card">
          <h2>RSS Ingestion</h2>
          <p className="muted">Fetch active RSS sources and save newly found articles.</p>
          <button
            type="button"
            disabled={actions.ingestion.loading}
            onClick={() => runAction("ingestion", () => runIngestion<IngestionRun>())}
          >
            {actions.ingestion.loading ? "Running Ingestion..." : "Run Ingestion"}
          </button>
          <ActionResult action="ingestion" result={actions.ingestion.result}>
            {(data) => (
              <>
                <p>
                  Ingestion completed with status <strong>{data.status}</strong>.
                </p>
                <dl className="metadata-list">
                  <div>
                    <dt>Articles fetched</dt>
                    <dd>{data.articles_fetched}</dd>
                  </div>
                  <div>
                    <dt>New articles</dt>
                    <dd>{data.articles_new}</dd>
                  </div>
                  <div>
                    <dt>Sources succeeded</dt>
                    <dd>
                      {data.sources_succeeded} of {data.sources_attempted}
                    </dd>
                  </div>
                </dl>
              </>
            )}
          </ActionResult>
        </article>

        <article className="panel workflow-card">
          <h2>AI Enrichment</h2>
          <p className="muted">Summarize and score pending articles.</p>
          <label className="field-label" htmlFor="enrichment-limit">
            Limit
          </label>
          <input
            id="enrichment-limit"
            min="1"
            max="25"
            type="number"
            value={enrichmentLimit}
            onChange={(event) => setEnrichmentLimit(clampLimit(event.target.valueAsNumber))}
          />
          <button
            type="button"
            disabled={actions.enrichment.loading}
            onClick={() =>
              runAction("enrichment", () =>
                runEnrichment<EnrichmentRunResponse>(enrichmentLimit),
              )
            }
          >
            {actions.enrichment.loading ? "Running Enrichment..." : "Run Enrichment"}
          </button>
          <ActionResult action="enrichment" result={actions.enrichment.result}>
            {(data) => (
              <>
                <p>
                  Enrichment completed with status <strong>{data.status}</strong>.
                </p>
                <dl className="metadata-list">
                  <div>
                    <dt>Attempted</dt>
                    <dd>{data.attempted}</dd>
                  </div>
                  <div>
                    <dt>Completed</dt>
                    <dd>{data.completed}</dd>
                  </div>
                  <div>
                    <dt>Failed</dt>
                    <dd>{data.failed}</dd>
                  </div>
                </dl>
              </>
            )}
          </ActionResult>
        </article>

        <article className="panel workflow-card">
          <h2>Generate Today&apos;s Brief</h2>
          <p className="muted">Create or update today&apos;s editorial brief from enriched articles.</p>
          <label className="field-label" htmlFor="brief-limit">
            Limit
          </label>
          <input
            id="brief-limit"
            min="1"
            max="25"
            type="number"
            value={briefLimit}
            onChange={(event) => setBriefLimit(clampLimit(event.target.valueAsNumber))}
          />
          <button
            type="button"
            disabled={actions.brief.loading}
            onClick={() => runAction("brief", () => generateBrief<Brief>(briefLimit))}
          >
            {actions.brief.loading ? "Generating Brief..." : "Generate Brief"}
          </button>
          <ActionResult action="brief" result={actions.brief.result}>
            {(data) => (
              <>
                <p>
                  Brief generated for <strong>{data.brief_date}</strong>.
                </p>
                {data.headline ? <p>{data.headline}</p> : null}
                <Link className="text-button" href="/briefs/today">
                  Open Today&apos;s Brief
                </Link>
              </>
            )}
          </ActionResult>
        </article>
      </section>
    </main>
  );
}
