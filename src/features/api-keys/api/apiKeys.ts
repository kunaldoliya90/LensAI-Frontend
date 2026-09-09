import { apiRequest } from "@/lib/api/client";
import type { ApiKeyEnvironment, ApiKeyIssued, ApiKeySummary } from "@/lib/api/types";

export function listApiKeys(): Promise<ApiKeySummary[]> {
  return apiRequest<ApiKeySummary[]>("/portal/api-keys", { auth: "jwt" });
}

export function createApiKey(input: {
  name: string;
  environment: ApiKeyEnvironment;
}): Promise<ApiKeyIssued> {
  return apiRequest<ApiKeyIssued>("/portal/api-keys", {
    method: "POST",
    auth: "jwt",
    json: input,
  });
}

export function revokeApiKey(input: {
  apiKeyId: string;
  reason: string;
}): Promise<ApiKeySummary> {
  return apiRequest<ApiKeySummary>(`/portal/api-keys/${input.apiKeyId}/revoke`, {
    method: "POST",
    auth: "jwt",
    json: { reason: input.reason },
  });
}
