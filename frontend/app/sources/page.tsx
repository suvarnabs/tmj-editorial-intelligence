"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  createSource,
  deactivateSource,
  fetchApi,
  updateSource,
  type ApiResult,
} from "@/lib/api";
import type { Source } from "@/lib/types";

type SourceForm = {
  name: string;
  source_type: string;
  feed_url: string;
  publisher: string;
  region: string;
  language: string;
  is_active: boolean;
  notes: string;
};

const emptyForm: SourceForm = {
  name: "",
  source_type: "rss",
  feed_url: "",
  publisher: "",
  region: "",
  language: "en",
  is_active: true,
  notes: "",
};

const duplicateFeedUrlMessage =
  "This feed URL already exists. Edit the existing source instead of adding a duplicate.";

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "Not available";
}

function sourceToForm(source: Source): SourceForm {
  return {
    name: source.name,
    source_type: source.source_type ?? "rss",
    feed_url: source.feed_url,
    publisher: source.publisher ?? "",
    region: source.region ?? "",
    language: source.language ?? "en",
    is_active: source.is_active,
    notes: source.notes ?? "",
  };
}

function cleanPayload(form: SourceForm) {
  return {
    name: form.name.trim(),
    source_type: form.source_type.trim() || "rss",
    feed_url: form.feed_url.trim(),
    publisher: form.publisher.trim() || null,
    region: form.region.trim() || null,
    language: form.language.trim() || "en",
    is_active: form.is_active,
    notes: form.notes.trim() || null,
  };
}

function validateForm(form: SourceForm) {
  if (!form.name.trim()) {
    return "Source name is required.";
  }

  if (!form.feed_url.trim()) {
    return "Feed URL is required.";
  }

  if (!/^https?:\/\//i.test(form.feed_url.trim())) {
    return "Feed URL should start with http:// or https://.";
  }

  return null;
}

function SourceFields({
  form,
  disabled,
  onChange,
}: {
  form: SourceForm;
  disabled: boolean;
  onChange: (form: SourceForm) => void;
}) {
  return (
    <div className="source-form-grid">
      <label>
        Source name
        <input
          disabled={disabled}
          required
          value={form.name}
          onChange={(event) => onChange({ ...form, name: event.target.value })}
        />
      </label>

      <label>
        Source type
        <select
          disabled={disabled}
          value={form.source_type}
          onChange={(event) => onChange({ ...form, source_type: event.target.value })}
        >
          <option value="rss">RSS feed</option>
        </select>
      </label>

      <label className="wide-field">
        Feed URL
        <input
          disabled={disabled}
          required
          type="url"
          value={form.feed_url}
          onChange={(event) => onChange({ ...form, feed_url: event.target.value })}
        />
      </label>

      <label>
        Publisher
        <input
          disabled={disabled}
          value={form.publisher}
          onChange={(event) => onChange({ ...form, publisher: event.target.value })}
        />
      </label>

      <label>
        Region
        <input
          disabled={disabled}
          value={form.region}
          onChange={(event) => onChange({ ...form, region: event.target.value })}
        />
      </label>

      <label>
        Language
        <input
          disabled={disabled}
          value={form.language}
          onChange={(event) => onChange({ ...form, language: event.target.value })}
        />
      </label>

      <label className="checkbox-label">
        <input
          checked={form.is_active}
          disabled={disabled}
          type="checkbox"
          onChange={(event) => onChange({ ...form, is_active: event.target.checked })}
        />
        Active source
      </label>

      <label className="wide-field">
        Notes
        <textarea
          disabled={disabled}
          value={form.notes}
          onChange={(event) => onChange({ ...form, notes: event.target.value })}
        />
      </label>
    </div>
  );
}

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<SourceForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<SourceForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const editingSource = useMemo(
    () => sources.find((source) => source.id === editingId) ?? null,
    [editingId, sources],
  );

  async function loadSources() {
    setLoading(true);
    const result = await fetchApi<Source[]>("/api/v1/sources");
    if (result.data) {
      setSources(result.data);
      setError(null);
    } else {
      setError(`Could not load sources: ${result.error}`);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadSources();
  }, []);

  function handleResult(result: ApiResult<Source>, successMessage: string, fallback: string) {
    if (result.data) {
      setMessage(successMessage);
      setError(null);
      return true;
    }

    if (result.status === 409 || result.error === duplicateFeedUrlMessage) {
      setError(duplicateFeedUrlMessage);
      setMessage(null);
      return false;
    }

    setError(`${fallback} Backend message: ${result.error}`);
    setMessage(null);
    return false;
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    const result = await createSource<Source>(cleanPayload(form));
    const ok = handleResult(
      result,
      "Source added. It is ready for the next ingestion run.",
      "Could not add source. Check that the backend is running and the feed URL is valid.",
    );
    if (ok) {
      setForm(emptyForm);
      await loadSources();
    }
    setSaving(false);
  }

  async function handleSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingId) {
      return;
    }

    const validationError = validateForm(editingForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUpdatingId(editingId);
    const result = await updateSource<Source>(editingId, cleanPayload(editingForm));
    const ok = handleResult(
      result,
      "Source updated.",
      "Could not update source. Check that the backend is running and the source details are valid.",
    );
    if (ok) {
      setEditingId(null);
      await loadSources();
    }
    setUpdatingId(null);
  }

  async function setActive(source: Source, isActive: boolean) {
    setUpdatingId(source.id);
    const result = isActive
      ? await updateSource<Source>(source.id, { is_active: true })
      : await deactivateSource<Source>(source.id);
    const ok = handleResult(
      result,
      isActive ? "Source reactivated." : "Source deactivated. Ingestion will ignore it.",
      isActive
        ? "Could not reactivate source. Check that the backend is running."
        : "Could not deactivate source. Check that the backend is running.",
    );
    if (ok) {
      await loadSources();
    }
    setUpdatingId(null);
  }

  function startEdit(source: Source) {
    setEditingId(source.id);
    setEditingForm(sourceToForm(source));
    setMessage(null);
    setError(null);
  }

  return (
    <main className="container page-stack">
      <div className="page-heading">
        <h1>Sources</h1>
        <p>Manage RSS sources used by the local ingestion workflow.</p>
      </div>

      {message ? <div className="state-box success">{message}</div> : null}
      {error ? <div className="state-box error">{error}</div> : null}

      <section className="panel">
        <h2>Add Source</h2>
        <form className="source-form" onSubmit={handleAdd}>
          <SourceFields form={form} disabled={saving} onChange={setForm} />
          <button type="submit" disabled={saving}>
            {saving ? "Adding Source..." : "Add Source"}
          </button>
        </form>
      </section>

      {editingSource ? (
        <section className="panel">
          <div className="section-header">
            <div>
              <h2>Edit Source</h2>
              <p className="muted">{editingSource.name}</p>
            </div>
            <button
              className="secondary-button"
              disabled={updatingId === editingSource.id}
              type="button"
              onClick={() => setEditingId(null)}
            >
              Cancel
            </button>
          </div>
          <form className="source-form" onSubmit={handleSaveEdit}>
            <SourceFields
              form={editingForm}
              disabled={updatingId === editingSource.id}
              onChange={setEditingForm}
            />
            <button type="submit" disabled={updatingId === editingSource.id}>
              {updatingId === editingSource.id ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </section>
      ) : null}

      <section className="section-header">
        <div>
          <h2>Source List</h2>
          <p className="muted">Inactive sources stay saved but are skipped by ingestion.</p>
        </div>
        <button className="secondary-button" type="button" onClick={loadSources}>
          Refresh
        </button>
      </section>

      {loading ? (
        <div className="state-box">Loading sources...</div>
      ) : sources.length === 0 ? (
        <div className="state-box">No sources found. Add an RSS feed to begin.</div>
      ) : (
        <section className="card-grid">
          {sources.map((source) => (
            <article className="panel source-card" key={source.id}>
              <div className="source-card-header">
                <div>
                  <span className={source.is_active ? "badge badge-good" : "badge badge-alert"}>
                    {source.is_active ? "Active" : "Inactive"}
                  </span>
                  <h2>{source.name}</h2>
                </div>
                <div className="source-actions">
                  <button
                    className="secondary-button"
                    disabled={updatingId === source.id}
                    type="button"
                    onClick={() => startEdit(source)}
                  >
                    Edit
                  </button>
                  <button
                    className="secondary-button"
                    disabled={updatingId === source.id}
                    type="button"
                    onClick={() => setActive(source, !source.is_active)}
                  >
                    {source.is_active ? "Deactivate" : "Reactivate"}
                  </button>
                </div>
              </div>

              <dl className="detail-list">
                <div>
                  <dt>Source type</dt>
                  <dd>{source.source_type === "rss" ? "RSS feed" : source.source_type}</dd>
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
                  <dt>Language</dt>
                  <dd>{source.language}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatDate(source.created_at)}</dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd>{formatDate(source.updated_at)}</dd>
                </div>
                <div>
                  <dt>Last fetched</dt>
                  <dd>{formatDate(source.last_fetched_at)}</dd>
                </div>
                <div>
                  <dt>Notes</dt>
                  <dd>{source.notes ?? "Not available"}</dd>
                </div>
              </dl>

              {source.last_error ? (
                <details className="technical-details">
                  <summary>Last source error</summary>
                  <p>{source.last_error}</p>
                </details>
              ) : null}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
