import { apiRequest } from "@/lib/api/client";
import type {
  WebhookEndpointCreated,
  WebhookEndpointSummary,
  WebhookSecretRotated,
} from "@/lib/api/types";

export interface CreateWebhookInput {
  client_id: string;
  url: string;
  description?: string;
  events: string[];
}

export function listWebhooks(clientId: string): Promise<WebhookEndpointSummary[]> {
  return apiRequest<WebhookEndpointSummary[]>("/portal/webhooks", {
    auth: "jwt",
    query: { client_id: clientId },
  });
}

export function createWebhook(input: CreateWebhookInput): Promise<WebhookEndpointCreated> {
  return apiRequest<WebhookEndpointCreated>("/portal/webhooks", {
    method: "POST",
    auth: "jwt",
    json: input,
  });
}

export function rotateWebhookSecret(endpointId: string): Promise<WebhookSecretRotated> {
  return apiRequest<WebhookSecretRotated>(`/portal/webhooks/${endpointId}/rotate-secret`, {
    method: "POST",
    auth: "jwt",
  });
}
