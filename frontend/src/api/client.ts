const DEFAULT_API_BASE_URL = "http://localhost:8000";
const ALLOWED_API_ORIGINS = new Set(["http://localhost:8000", "http://127.0.0.1:8000"]);

type QueryValue = string | number | boolean | null | undefined;

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

export function buildApiUrl(path: string, query?: Record<string, QueryValue>): string {
  if (!path.startsWith("/api/")) {
    throw new Error("API path must start with /api/");
  }

  if (path.startsWith("//") || path.includes("..")) {
    throw new Error("API path is not allowed");
  }

  const apiBaseUrl = new URL(getApiBaseUrl());

  if (!ALLOWED_API_ORIGINS.has(apiBaseUrl.origin)) {
    throw new Error("API origin is not allowed");
  }

  const apiUrl = new URL(path, apiBaseUrl.origin);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      apiUrl.searchParams.set(key, String(value));
    }
  });

  return apiUrl.toString();
}

export async function getHealthStatus(): Promise<string> {
  const response = await fetch(buildApiUrl("/api/health"));

  if (!response.ok) {
    throw new Error(`Healthcheck failed with status ${response.status}`);
  }

  const body = (await response.json()) as { status?: string };
  return body.status ?? "unknown";
}

export async function apiRequest<T>(
  path: string,
  options?: RequestInit,
  query?: Record<string, QueryValue>,
): Promise<T> {
  const headers = new Headers(options?.headers);
  headers.set("Content-Type", "application/json");

  const requestOptions: RequestInit = {
    ...options,
    headers,
  };
  const response = await fetch(buildApiUrl(path, query), requestOptions);

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}
