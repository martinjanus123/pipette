const DEFAULT_API_BASE_URL = "http://localhost:8000";

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

export async function getHealthStatus(): Promise<string> {
  const response = await fetch(`${getApiBaseUrl()}/api/health`);

  if (!response.ok) {
    throw new Error(`Healthcheck failed with status ${response.status}`);
  }

  const body = (await response.json()) as { status?: string };
  return body.status ?? "unknown";
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {})
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}
