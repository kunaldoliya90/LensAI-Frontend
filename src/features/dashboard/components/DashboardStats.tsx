import { BarChart3, CircleAlert, FileStack, Files } from "lucide-react";
import Link from "next/link";
import type { UsageLine } from "@/lib/api/types";
import { CountUp } from "@/components/ui/CountUp";
import { percentChange } from "@/lib/format";
import { StatCard, type StatDelta } from "./StatCard";

/**
 * This month's volume, each figure against the same span of last month.
 *
 * ⚠ There is deliberately no pass/fail card. The console has no route that
 * returns verdicts — `/portal/usage` counts work done and `/v1/verifications` is
 * API-key-only — so an outcome breakdown here would have to be invented. The
 * verdict a document received is visible per job in the playground.
 *
 * Tokens are also absent, and that omission is load-bearing: the usage totals sum
 * across provider scopes, so a single token figure would merge tokens we billed
 * with tokens the tenant's own provider billed. That distinction is the entire
 * point of the scope split, so tokens are only shown on the usage page where the
 * scope is on screen beside them.
 */
export function DashboardStats({
  current,
  previous,
  loading,
}: {
  current: UsageLine | null | undefined;
  previous: UsageLine | null | undefined;
  loading: boolean;
}) {
  // An em dash while the month is still loading, then the figure climbing to
  // itself. CountUp formats every frame, so the separators are never wrong.
  const figure = (value: number | undefined) =>
    loading ? "—" : <CountUp value={value ?? 0} />;

  const delta = (
    key: keyof Pick<UsageLine, "verifications" | "documents" | "pages" | "failed_attempt_tokens">,
    tone?: StatDelta["tone"],
  ): StatDelta | undefined => {
    if (loading) return undefined;
    return {
      percent: percentChange(current?.[key] ?? 0, previous?.[key] ?? 0),
      caption: "vs last month",
      tone,
    };
  };

  const wasted = current?.failed_attempt_tokens ?? 0;

  return (
    <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={BarChart3}
        tone="info"
        label="Verifications this month"
        value={figure(current?.verifications)}
        delta={delta("verifications")}
      />
      <StatCard
        icon={Files}
        label="Documents"
        value={figure(current?.documents)}
        delta={delta("documents")}
      />
      <StatCard
        icon={FileStack}
        label="Pages processed"
        value={figure(current?.pages)}
        delta={delta("pages")}
      />
      <StatCard
        icon={CircleAlert}
        // Only coloured as a problem when there is one. A permanently red card
        // reading zero trains people to stop looking at it.
        tone={wasted > 0 ? "fail" : "neutral"}
        label="Failed-attempt tokens"
        value={figure(current?.failed_attempt_tokens)}
        delta={delta("failed_attempt_tokens", wasted > 0 ? "fail" : undefined)}
        detail={
          <Link href="/app/usage" className="text-accent-bright underline underline-offset-2">
            Split by provider scope
          </Link>
        }
      />
    </section>
  );
}
