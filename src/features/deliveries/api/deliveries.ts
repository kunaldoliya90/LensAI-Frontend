import { apiRequest } from "@/lib/api/client";
import type { DeliverySummary } from "@/lib/api/types";

export interface DeliveryFilters {
  reference_id?: string;
  status?: string;
  limit: number;
}

export function listDeliveries(filters: DeliveryFilters): Promise<DeliverySummary[]> {
  return apiRequest<DeliverySummary[]>("/portal/webhooks/deliveries", {
    auth: "jwt",
    query: {
      reference_id: filters.reference_id,
      status: filters.status,
      limit: filters.limit,
    },
  });
}

export function replayDelivery(logId: string): Promise<void> {
  return apiRequest<void>(`/portal/webhooks/deliveries/${logId}/replay`, {
    method: "POST",
    auth: "jwt",
  });
}
