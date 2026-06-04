import { apiRequest } from "./client";
import type { PipetteCreatePayload, PipetteListItem, PipetteDetail } from "./types";

export async function getPipettes(query?: string): Promise<PipetteListItem[]> {
  return apiRequest<PipetteListItem[]>('/api/pipettes', undefined, { q: query });
}

export async function getPipette(id: string): Promise<PipetteDetail> {
  return apiRequest<PipetteDetail>(`/api/pipettes/${id}`);
}

export async function createPipette(payload: PipetteCreatePayload): Promise<PipetteListItem> {
  return apiRequest<PipetteListItem>('/api/pipettes', {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function changePipetteStatus(
  id: string,
  newStatus: 'active' | 'maintenance' | 'retired',
  notes?: string,
  created_by?: string,
): Promise<PipetteDetail> {
  const payload: any = { new_status: newStatus };
  if (notes) payload.notes = notes;
  if (created_by) payload.created_by = created_by;
  return apiRequest<PipetteDetail>(`/api/pipettes/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
