import { apiRequest } from "./client";
import type { PipetteCreatePayload, PipetteListItem, PipettePaginatedResponse } from "./types";

export interface PipetteQueryOptions {
  q?: string;
  room_id?: number;
  application_id?: number;
  use_id?: number;
  pipette_type_id?: number;
  status?: string;
  limit?: number;
  offset?: number;
}

export async function getPipettes(options?: PipetteQueryOptions): Promise<PipettePaginatedResponse> {
  const params: Record<string, any> = {};
  if (options) {
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params[key] = value;
      }
    });
  }
  return apiRequest<PipettePaginatedResponse>("/api/pipettes", undefined, params);
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
