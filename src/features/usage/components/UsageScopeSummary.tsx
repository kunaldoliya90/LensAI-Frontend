import { Callout } from "@/components/ui/Callout";
import { Pill } from "@/components/ui/Pill";
import { formatInteger } from "@/lib/format";
import type { UsageLine } from "@/lib/api/types";
import { COUNTERS, totalsByScope } from "../usageCounters";

const SCOPE_NOTE: Record<string, string> = {
  PLATFORM: "Processed on the LensAI platform model. This is what LensAI bills.",
  TENANT: "Processed on your own provider. Billed to you by them; shown here so the two reconcile.",
};

export function UsageScopeSummary({ lines }: { lines: UsageLine[] }) {
  const scopes = totalsByScope(lines);

  if (scopes.length === 0) return null;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        {scopes.map(({ scope, totals }) => (
          <section key={scope} className="panel p-4">
            <h3 className="flex items-center gap-2 text-[12.5px] font-medium">
              <Pill tone={scope === "PLATFORM" ? "info" : "neutral"}>{scope}</Pill>
            </h3>
            <p className="mt-1 text-[13px] text-ink-muted">{SCOPE_NOTE[scope] ?? ""}</p>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              {COUNTERS.map((counter) => (
                <div key={counter.key} className="flex justify-between gap-2 border-b border-line py-1">
                  <dt className="text-ink-muted">{counter.label}</dt>
                  <dd className="font-mono tabular-nums">{formatInteger(totals[counter.key])}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <Callout tone="neutral" title="failed_attempt_tokens usually explains a discrepancy">
        A provider bills for tokens generated before a timeout, so an attempt that produced no
        verdict still cost something. Those tokens are counted here and are not part of the
        verification count.
      </Callout>
    </div>
  );
}
