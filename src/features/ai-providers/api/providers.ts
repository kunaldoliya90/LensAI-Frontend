import { apiRequest } from "@/lib/api/client";
import type {
  DataPolicy,
  ProviderAdapter,
  ProviderRegistered,
  RoutingSummary,
} from "@/lib/api/types";

export interface RegisterProviderInput {
  name: string;
  adapter: ProviderAdapter;
  model: string;
  api_key?: string;
  config: Record<string, unknown>;
}

export function listProviders(): Promise<RoutingSummary> {
  return apiRequest<RoutingSummary>("/portal/ai-providers", { auth: "jwt" });
}

export function registerProvider(input: RegisterProviderInput): Promise<ProviderRegistered> {
  return apiRequest<ProviderRegistered>("/portal/ai-providers", {
    method: "POST",
    auth: "jwt",
    json: input,
  });
}

export function checkProviderHealth(providerId: string): Promise<ProviderRegistered> {
  return apiRequest<ProviderRegistered>(`/portal/ai-providers/${providerId}/health-check`, {
    method: "POST",
    auth: "jwt",
  });
}

export function setDefaultProvider(providerId: string): Promise<void> {
  return apiRequest<void>(`/portal/ai-providers/${providerId}/set-default`, {
    method: "POST",
    auth: "jwt",
  });
}

export function disableProvider(providerId: string): Promise<void> {
  return apiRequest<void>(`/portal/ai-providers/${providerId}/disable`, {
    method: "POST",
    auth: "jwt",
  });
}

export function setDataPolicy(dataPolicy: DataPolicy): Promise<void> {
  return apiRequest<void>("/portal/ai-providers/data-policy", {
    method: "PUT",
    auth: "jwt",
    json: { data_policy: dataPolicy },
  });
}
