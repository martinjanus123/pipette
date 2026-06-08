import { apiRequest } from "./client";
import type {
  PipetteCreatePayload,
  PipetteListItem,
  PipetteDetail,
  PipetteStatusUpdatePayload,
} from "./types";

export async function getPipettes(query?: string): Promise<PipetteListItem[]> {
  return apiRequest<PipetteListItem[]>("/api/pipettes", undefined, { q: query });
}

export async function getPipette(id: string): Promise<PipetteDetail> {
  return apiRequest<PipetteDetail>(`/api/pipettes/${id}`);
}

export async function createPipette(payload: PipetteCreatePayload): Promise<PipetteDetail> {
  return apiRequest<PipetteDetail>("/api/pipettes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function changePipetteStatus(
  id: string,
  payload: PipetteStatusUpdatePayload
): Promise<PipetteDetail> {
  return apiRequest<PipetteDetail>(`/api/pipettes/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
