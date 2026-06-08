import { apiRequest } from "./client";
import type { PipetteCreatePayload, PipetteListItem, PaginatedPipetteResponse } from "./types";

export async function getPipettes(query?: string): Promise<PipetteListItem[]> {
  const resp = await apiRequest<PaginatedPipetteResponse>("/api/pipettes", undefined, { q: query });
  return resp.items;
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
