import { apiRequest } from "./client";
import type { PipetteCreatePayload, PipetteListItem, CalibrationImportResponse } from "./types";

export async function getPipettes(query?: string): Promise<PipetteListItem[]> {
  return apiRequest<PipetteListItem[]>("/api/pipettes", undefined, { q: query });
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
+
+export async function importCalibrations(csvText: string): Promise<CalibrationImportResponse> {
+  return apiRequest<CalibrationImportResponse>("/api/calibrations/import", {
+    method: "POST",
+    body: JSON.stringify({ csv_text: csvText })
+  });
+}
