import { apiRequest } from "./client";
import type { DropdownData, ReferenceItem } from "./types";

export async function getDropdownData(): Promise<DropdownData> {
  const [rooms, applications, uses, pipetteTypes] = await Promise.all([
    apiRequest<ReferenceItem[]>("/api/rooms"),
    apiRequest<ReferenceItem[]>("/api/applications"),
    apiRequest<ReferenceItem[]>("/api/uses"),
    apiRequest<ReferenceItem[]>("/api/pipette-types")
  ]);

  return { rooms, applications, uses, pipetteTypes };
}
