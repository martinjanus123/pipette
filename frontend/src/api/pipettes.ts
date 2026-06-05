import { apiRequest } from "./client";
import type { PipetteCreatePayload, PipetteListItem, BulkRoomMovePayload } from "./types";

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

export async function bulkRoomMove(payload: BulkRoomMovePayload): Promise<{ moved_ids: number[] }> {
  return apiRequest<{ moved_ids: number[] }>("/api/pipettes/bulk-room-move", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
