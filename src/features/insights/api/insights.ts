import { apiRequest } from "@/lib/api/client";
import type {
  InsightDimension,
  InsightsDetail,
  InsightsOverview,
  InsightsReport,
  InsightsUsage,
} from "@/lib/api/types";

/**
 * Who is looking decides which surface answers: a tenant user reads their own
 * tenant on /portal/insights, staff read across tenants on /admin/insights and
 * may narrow to one with `tenantId`. Same shapes either way.
 */
export interface InsightScope {
  staff: boolean;
  tenantId?: string;
  clientId?: string;
  months: number;
  filters: Partial<Record<InsightDimension, string>>;
}

function base(staff: boolean): string {
  return staff ? "/admin/insights" : "/portal/insights";
}

/** Months are bucketed in the viewer's own offset, not the server's. */
function utcOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

function scopeQuery(scope: InsightScope) {
  return {
    tenant_id: scope.staff ? scope.tenantId : undefined,
    client_id: scope.clientId,
    months: scope.months,
    utc_offset_minutes: utcOffsetMinutes(),
    ...scope.filters,
  };
}

export function getOverview(scope: InsightScope): Promise<InsightsOverview> {
  return apiRequest<InsightsOverview>(`${base(scope.staff)}/overview`, {
    auth: "jwt",
    query: scopeQuery(scope),
  });
}

export function getReport(
  scope: InsightScope,
  input: { q: string; flag: "all" | "yes" | "no"; page: number; pageSize: number },
): Promise<InsightsReport> {
  return apiRequest<InsightsReport>(`${base(scope.staff)}/verifications`, {
    auth: "jwt",
    query: {
      ...scopeQuery(scope),
      q: input.q,
      flag: input.flag,
      page: input.page,
      page_size: input.pageSize,
    },
  });
}

export function getDetail(staff: boolean, verificationId: string): Promise<InsightsDetail> {
  return apiRequest<InsightsDetail>(`${base(staff)}/verifications/${verificationId}`, {
    auth: "jwt",
  });
}

export function getUsage(scope: InsightScope): Promise<InsightsUsage> {
  return apiRequest<InsightsUsage>(`${base(scope.staff)}/usage`, {
    auth: "jwt",
    // Usage is volume per client; the dimension filters do not apply to it.
    query: scopeQuery({ ...scope, filters: {} }),
  });
}

export const DIMENSION_KEYS: readonly InsightDimension[] = [
  "department",
  "location",
  "entity",
  "criticality",
  "nature",
  "submitter",
  "field",
];

export const DIMENSION_LABEL: Record<InsightDimension, string> = {
  department: "Department",
  location: "Location",
  entity: "Entity",
  criticality: "Criticality",
  nature: "Compliance nature",
  submitter: "Submitter",
  field: "Mismatched field",
};
