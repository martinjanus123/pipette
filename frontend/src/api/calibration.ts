import { apiRequest } from "./client";

export interface CalibrationImportResponse {
  imported: number;
  errors: Array<{ line: number; field: string; message: string }>;
}

export async function importCalibrations(csvText: string): Promise<CalibrationImportResponse> {
  return apiRequest<CalibrationImportResponse>("/api/calibrations/import", {
    method: "POST",
    body: JSON.stringify({ csv_text: csvText }),
  });
}
