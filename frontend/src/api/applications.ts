import { apiRequest } from "./client";
import type { ReferenceItem } from "./types";

export async function createApplication(name: string): Promise<ReferenceItem> {
  return apiRequest<ReferenceItem>("/api/applications", {
    method: "POST",
    body: JSON.stringify({ name }),
    headers: {
      "Content-Type": "application/json",
    },
  });
}
