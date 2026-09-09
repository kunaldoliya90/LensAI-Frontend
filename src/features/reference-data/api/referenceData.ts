import { apiRequest } from "@/lib/api/client";
import type { ReferenceDataDetail, ReferenceDataSummary } from "@/lib/api/types";

export function listReferenceData(): Promise<ReferenceDataSummary[]> {
  return apiRequest<ReferenceDataSummary[]>("/portal/reference-data", { auth: "jwt" });
}

export function getReferenceData(key: string, version?: number): Promise<ReferenceDataDetail> {
  return apiRequest<ReferenceDataDetail>(`/portal/reference-data/${encodeURIComponent(key)}`, {
    auth: "jwt",
    query: { version },
  });
}

export function saveReferenceData(input: {
  key: string;
  mapping: Record<string, unknown>;
  description?: string;
}): Promise<ReferenceDataSummary> {
  return apiRequest<ReferenceDataSummary>(
    `/portal/reference-data/${encodeURIComponent(input.key)}`,
    {
      method: "PUT",
      auth: "jwt",
      json: { mapping: input.mapping, description: input.description ?? null },
    },
  );
}
