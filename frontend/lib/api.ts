export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

export const API_SECRET_KEY =
  process.env.NEXT_PUBLIC_API_SECRET_KEY ?? "tmj-local-dev-secret-2026";

export type ApiResult<T> =
  | { data: T; error: null; status: number }
  | { data: null; error: string; status: number };

export async function fetchApi<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const url = `${API_BASE_URL}${path}`;

  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
    });

    if (!response.ok) {
      let detail = `${response.status} ${response.statusText}`;
      try {
        const body = await response.json();
        detail = body.detail ?? detail;
      } catch {
        // Keep the HTTP status message when the backend does not return JSON.
      }
      return { data: null, error: detail, status: response.status };
    }

    return { data: (await response.json()) as T, error: null, status: response.status };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Could not reach the backend.",
      status: 0,
    };
  }
}

function workflowHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-API-Key": API_SECRET_KEY,
  };
}

export function runIngestion<T>() {
  return fetchApi<T>("/api/v1/ingestion/run", {
    method: "POST",
    headers: workflowHeaders(),
  });
}

export function runEnrichment<T>(limit: number) {
  return fetchApi<T>("/api/v1/enrichment/run", {
    method: "POST",
    headers: workflowHeaders(),
    body: JSON.stringify({ limit }),
  });
}

export function generateBrief<T>(limit: number) {
  return fetchApi<T>("/api/v1/briefs/generate", {
    method: "POST",
    headers: workflowHeaders(),
    body: JSON.stringify({ limit }),
  });
}

export function createSource<T>(payload: Record<string, unknown>) {
  return fetchApi<T>("/api/v1/sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateSource<T>(sourceId: string, payload: Record<string, unknown>) {
  return fetchApi<T>(`/api/v1/sources/${sourceId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deactivateSource<T>(sourceId: string) {
  return fetchApi<T>(`/api/v1/sources/${sourceId}`, {
    method: "DELETE",
  });
}
