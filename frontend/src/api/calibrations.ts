import { apiRequest } from "./client";
import type { CalibrationImportResponse } from "./types";

export async function importCalibrations(csvText: string): Promise<CalibrationImportResponse> {
  return apiRequest<CalibrationImportResponse>("/api/calibrations/import", {
    method: "POST",
    body: JSON.stringify({ csv_text: csvText }),
  });
}
