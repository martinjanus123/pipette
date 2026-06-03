import { apiRequest } from "./client";
import type { PipetteCreatePayload, PipetteListItem, PipetteDetail, CalibrationCreatePayload } from "./types";

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

export async function createCalibration(pipetteId: string, payload: CalibrationCreatePayload): Promise<any> {
  return apiRequest<any>(`/api/pipettes/${pipetteId}/calibrations`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
