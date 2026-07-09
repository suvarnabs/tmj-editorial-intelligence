import type { Brief } from "@/lib/types";
import type React from "react";

function formatKey(key: string) {
  return key.replaceAll("_", " ");
}

function renderValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="muted">Not available</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="muted">No items</span>;
    }

    return (
      <ul className="stack-list">
        {value.map((item, index) => (
          <li key={index}>{renderValue(item)}</li>
        ))}
      </ul>
    );
  }

  if (typeof value === "object") {
    return (
      <dl className="detail-list">
        {Object.entries(value as Record<string, unknown>).map(([key, nested]) => (
          <div key={key}>
            <dt>{formatKey(key)}</dt>
            <dd>{renderValue(nested)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return String(value);
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
        <h2>Sections</h2>
        <div className="section-grid">
          {Object.entries(brief.sections ?? {}).map(([key, value]) => (
            <article className="subpanel" key={key}>
              <h3>{formatKey(key)}</h3>
              {renderValue(value)}
            </article>
          ))}
        </div>
      </section>

      <section className="two-column">
        <article className="panel">
          <h2>Ranked Article IDs</h2>
          {brief.ranked_article_ids && brief.ranked_article_ids.length > 0 ? (
            <ol className="stack-list">
              {brief.ranked_article_ids.map((id) => (
                <li key={id}>
                  <code>{id}</code>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">No ranked articles recorded.</p>
          )}
        </article>

        <article className="panel">
          <h2>Metadata</h2>
          {brief.metadata ? renderValue(brief.metadata) : <p className="muted">No metadata recorded.</p>}
        </article>
      </section>
    </div>
  );
}
