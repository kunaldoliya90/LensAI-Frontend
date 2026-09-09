import type { UsageLine } from "@/lib/api/types";

export const COUNTERS = [
  { key: "verifications", label: "Verifications" },
  { key: "documents", label: "Documents" },
  { key: "pages", label: "Pages" },
  { key: "input_tokens", label: "Input tokens" },
  { key: "cached_input_tokens", label: "Cached input" },
  { key: "output_tokens", label: "Output tokens" },
  { key: "failed_attempt_tokens", label: "Failed-attempt tokens" },
] as const satisfies readonly { key: keyof UsageLine; label: string }[];

export type CounterKey = (typeof COUNTERS)[number]["key"];

export interface ScopeTotals {
  scope: string;
  totals: Record<CounterKey, number>;
}

/**
 * PLATFORM and TENANT are summed separately and never added together: tenant
 * tokens were billed by the tenant's own provider, so one combined figure would
 * invoice the same inference twice.
 */
export function totalsByScope(lines: UsageLine[]): ScopeTotals[] {
  const byScope = new Map<string, Record<CounterKey, number>>();

  for (const line of lines) {
    const current =
      byScope.get(line.provider_scope) ??
      (Object.fromEntries(COUNTERS.map((counter) => [counter.key, 0])) as Record<
        CounterKey,
        number
      >);

    for (const counter of COUNTERS) current[counter.key] += line[counter.key];
    byScope.set(line.provider_scope, current);
  }

  return [...byScope.entries()]
    .map(([scope, totals]) => ({ scope, totals }))
    .sort((a, b) => a.scope.localeCompare(b.scope));
}
