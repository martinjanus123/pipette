import { apiRequest } from "./client";
import type { PipetteCreatePayload, PipetteListItem } from "./types";

export interface PaginatedPipettesResponse {
  items: PipetteListItem[];
  total: number;
  limit: number;
  offset: number;
}

export async function getPipettes(query?: string): Promise<PipetteListItem[]> {
  const response = await apiRequest<PaginatedPipettesResponse>("/api/pipettes", undefined, { q: query });
  return response.items;
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
