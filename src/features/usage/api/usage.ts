import { apiRequest } from "@/lib/api/client";
import type { UsageReport } from "@/lib/api/types";

export interface UsageRange {
  from: string;
  to: string;
}

export function getTenantUsage(range: UsageRange & { byTemplate: boolean }): Promise<UsageReport> {
  return apiRequest<UsageReport>("/portal/usage", {
    auth: "jwt",
    query: {
      from: range.from,
      to: range.to,
      // FastAPI wants the literal strings, not 1/0.
      by_template: range.byTemplate ? "true" : "false",
    },
  });
}

export function getPlatformUsage(range: UsageRange): Promise<UsageReport> {
  return apiRequest<UsageReport>("/admin/usage", {
    auth: "jwt",
    query: { from: range.from, to: range.to },
  });
}
