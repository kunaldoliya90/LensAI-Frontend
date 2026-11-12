import { numberIn } from "@/hooks/useUrlParams";
import type { InsightDimension } from "@/lib/api/types";
import { DIMENSION_KEYS, type InsightScope } from "./api/insights";

export const PERIODS = [12, 6, 3] as const;

/**
 * Every Insights page reads its scope from the URL — tenant, client, period
 * and the click-to-filter dimensions — so a filtered view survives a reload,
 * can be shared, and carries over between Overview, AI report and Usage.
 */
export function readScope(params: URLSearchParams, staff: boolean): InsightScope {
  const filters: Partial<Record<InsightDimension, string>> = {};
  for (const key of DIMENSION_KEYS) {
    const value = params.get(key);
    if (value) filters[key] = value.slice(0, 255);
  }
  return {
    staff,
    tenantId: staff ? params.get("tenant") || undefined : undefined,
    clientId: params.get("client") || undefined,
    months: numberIn(params.get("months"), PERIODS, 12),
    filters,
  };
}

/** The query keys an Insights link should carry to keep the same scope. */
export function scopeHref(path: string, params: URLSearchParams): string {
  const keep = new URLSearchParams();
  for (const key of ["tenant", "client", "months", ...DIMENSION_KEYS]) {
    const value = params.get(key);
    if (value) keep.set(key, value);
  }
  const query = keep.toString();
  return query ? `${path}?${query}` : path;
}

export function formatSeconds(seconds: number | null): string {
  if (seconds === null) return "–";
  return seconds < 90 ? `${Math.round(seconds)} s` : `${(seconds / 60).toFixed(1)} min`;
}

export function formatRate(rate: number): string {
  return `${rate.toFixed(1)}%`;
}
