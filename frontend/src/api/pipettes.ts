import { apiRequest } from "./client";
import type { PipetteDetail, PipetteListItem } from "./types";

export function getPipettes(query: string = ""): Promise<PipetteListItem[]> {
  const url = query ? `/api/pipettes?${new URLSearchParams({ q: query })}` : "/api/pipettes";
  return apiRequest(url);
}

export function getPipette(id: string): Promise<PipetteDetail> {
  return apiRequest(`/api/pipettes/${id}`);
}

export function patchPipetteStatus(
  id: string,
  payload: { status: string; notes?: string; created_by?: string },
): Promise<PipetteDetail> {
  return apiRequest(`/api/pipettes/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}
