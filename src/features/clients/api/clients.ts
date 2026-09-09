import { apiRequest } from "@/lib/api/client";
import type { ClientSummary } from "@/lib/api/types";

export interface CreateClientInput {
  name: string;
  contact_email?: string;
}

export function listClients(): Promise<ClientSummary[]> {
  return apiRequest<ClientSummary[]>("/portal/clients", { auth: "jwt" });
}

export function createClient(input: CreateClientInput): Promise<ClientSummary> {
  return apiRequest<ClientSummary>("/portal/clients", {
    method: "POST",
    auth: "jwt",
    json: input,
  });
}
