export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

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
