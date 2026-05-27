import { apiRequest } from "./client";
import type { PipetteCreatePayload, PipetteListItem } from "./types";

export async function getPipettes(query?: string): Promise<PipetteListItem[]> {
  const search = query ? `?q=${encodeURIComponent(query)}` : "";
  return apiRequest<PipetteListItem[]>(`/api/pipettes${search}`);
}

export async function getPipette(id: string): Promise<PipetteListItem> {
  return apiRequest<PipetteListItem>(`/api/pipettes/${id}`);
}

export async function createPipette(payload: PipetteCreatePayload): Promise<PipetteListItem> {
  return apiRequest<PipetteListItem>("/api/pipettes", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
