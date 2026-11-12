"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Callout } from "@/components/ui/Callout";
import { useUrlParams } from "@/hooks/useUrlParams";
import { isStaff } from "@/lib/auth/session";
import { useSession } from "@/lib/auth/useSession";
import { formatInteger } from "@/lib/format";
import type { InsightBreakdown, InsightDimension } from "@/lib/api/types";
import { getOverview } from "../api/insights";
import { formatRate, formatSeconds, readScope } from "../scope";
import {
  BarRow,
  BreakdownRows,
  Delta,
  InsightPanel,
  Kpi,
  KpiStrip,
  Legend,
  TrendChart,
} from "./charts";
import { FilterChips, InsightsScopeBar } from "./InsightsScopeBar";

const CRITICALITY_COLOR: Record<string, string> = {
  HIGH: "var(--chart-flag)",
  MEDIUM: "var(--color-warn)",
  LOW: "var(--color-ink-subtle)",
};

const CRITICALITY_LABEL: Record<string, string> = { HIGH: "High", MEDIUM: "Medium", LOW: "Low" };

/**
 * What LensAI's checks found in the submissions sent by a tenant's tools.
 * Every bar is also a filter: clicking one narrows the whole page, and the
 * filters live in the URL so AI report opens on the same slice.
 */
export function Overview() {
  const session = useSession();
  const staff = isStaff(session);
  const { params, setParams } = useUrlParams();
  const scope = readScope(params, staff);

  const overview = useQuery({
    queryKey: ["insights", "overview", scope],
    queryFn: () => getOverview(scope),
    // Keep the last figures on screen while a filter refetches: flashing every
    // KPI to 0 reads as "nothing was found", which is the wrong message.
    placeholderData: keepPreviousData,
  });

  const toggle = (dimension: InsightDimension, key: string) =>
    setParams({ [dimension]: scope.filters[dimension] === key ? null : key, page: null });

  const data = overview.data;
  const kpis = data?.kpis;
  const top = (items: InsightBreakdown[] | undefined) =>
    items?.[0] && items[0].red_flagged > 0 ? (
      <>
        {" "}
        Most red flags: <b className="font-semibold text-ink-muted">{items[0].label}</b> ({items[0].red_flagged}).
      </>
    ) : null;

  const breakdown = (
    title: string,
    sub: string,
    key: keyof NonNullable<typeof data>["breakdowns"],
    dimension?: InsightDimension,
  ) => {
    const items = data?.breakdowns[key] ?? [];
    return (
      <InsightPanel title={title} sub={<>{sub}{top(items)}</>}>
        <BreakdownRows
          items={items}
          selected={dimension ? scope.filters[dimension] : scope.clientId}
          onSelect={
            dimension
              ? (k) => toggle(dimension, k)
              : (k) => setParams({ client: scope.clientId === k ? null : k, page: null })
          }
        />
      </InsightPanel>
    );
  };

  return (
    <>
      <InsightsScopeBar />

      <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-2.5 pb-1">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">Red-flag overview</h1>
          <p className="mt-1 max-w-[75ch] text-[13.5px] text-ink-muted">
            What LensAI&apos;s AI checks found in compliances submitted through your clients&apos; tools,
            over the last {scope.months} months. Click any bar to filter the page.
          </p>
        </div>
        <FilterChips />
      </div>

      {overview.error ? <ErrorNotice error={overview.error} /> : null}
      {data?.truncated ? (
        <Callout tone="warn" title="Showing a partial period">
          This period has more verifications than the dashboard reads at once. Narrow the client or period for exact figures.
        </Callout>
      ) : null}

      <KpiStrip>
        <Kpi label="Compliances AI-checked" value={formatInteger(kpis?.checked ?? 0)} note={`${formatInteger(kpis?.checks_run ?? 0)} individual checks run`} />
        <Kpi tone="good" label="Without red flags" value={formatInteger(kpis?.clean ?? 0)} note={`${formatRate(kpis && kpis.checked ? (100 * kpis.clean) / kpis.checked : 0)} of checked`} />
        <Kpi tone="bad" label="Red-flagged" value={formatInteger(kpis?.red_flagged ?? 0)} note={`${formatRate(kpis?.red_flag_rate ?? 0)} red-flag rate`} />
        <Kpi
          label={kpis?.rate_change ? `Red-flag rate, ${kpis.rate_change.current_month.slice(0, 3)} vs ${kpis.rate_change.previous_month.slice(0, 3)}` : "Red-flag rate, month on month"}
          value={kpis?.rate_change ? formatRate(kpis.rate_change.current_rate) : "–"}
          note={kpis?.rate_change ? <Delta points={kpis.rate_change.delta} /> : "Not enough data"}
        />
        <Kpi tone="bad" label="High-criticality red flags" value={formatInteger(kpis?.high_criticality_red_flagged ?? 0)} note={`${kpis?.departments_impacted ?? 0} departments impacted`} />
        <Kpi label="Avg. AI turnaround" value={formatSeconds(kpis?.avg_turnaround_seconds ?? null)} note="Per compliance, all documents" />
      </KpiStrip>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        <InsightPanel
          title="Red-flag summary by month"
          sub="Bars: compliances checked, red part red-flagged. Line: red-flag rate."
          aside={
            <Legend
              items={[
                { label: "Checked", color: "var(--chart-base)" },
                { label: "Red-flagged", color: "var(--chart-flag)" },
                { label: "Red-flag rate", color: "var(--color-accent)", line: true },
              ]}
            />
          }
        >
          <TrendChart points={data?.trend ?? []} />
          <p className="mt-1 text-[12.5px] text-ink-subtle">* Current month to date.</p>
        </InsightPanel>

        <InsightPanel title="Criticality-wise red flags" sub="Share of each criticality that came back red-flagged.">
          <div className="flex flex-col gap-0.5">
            {(data?.criticality ?? []).map((c) => {
              const share = c.total ? (100 * c.red_flagged) / c.total : 0;
              return (
                <button
                  key={c.key}
                  type="button"
                  aria-pressed={scope.filters.criticality === c.key}
                  onClick={() => toggle("criticality", c.key)}
                  className="grid w-full grid-cols-[82px_minmax(0,1fr)_88px] items-center gap-3.5 rounded-md border border-transparent px-2 py-2.5 text-left hover:bg-surface-strong aria-pressed:border-accent/30 aria-pressed:bg-accent-soft"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <span className="size-2 rounded-[2px]" style={{ background: CRITICALITY_COLOR[c.key] }} />
                    {CRITICALITY_LABEL[c.key] ?? c.label}
                  </span>
                  <span className="h-2 overflow-hidden rounded-[2px] bg-[var(--chart-track)]">
                    <i className="block h-full rounded-[2px]" style={{ width: `${share}%`, background: CRITICALITY_COLOR[c.key] }} />
                  </span>
                  <span className="text-right text-[12px] text-ink-subtle tabular-nums">
                    <b className="block text-[14px] font-semibold text-ink">{formatInteger(c.red_flagged)}</b>
                    {share.toFixed(0)}% of {formatInteger(c.total)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 mb-2.5">
            <h2 className="text-[14.5px] font-semibold text-ink">Most mismatched fields</h2>
            <p className="mt-0.5 text-[12.5px] text-ink-subtle">Where submissions and documents disagree most often.</p>
          </div>
          <div className="flex flex-col gap-px">
            {(data?.fields ?? []).slice(0, 7).map((f, _, list) => (
              <BarRow
                key={f.key}
                label={f.label}
                pressed={scope.filters.field === f.key}
                onClick={() => toggle("field", f.key)}
                title={`${f.label}: ${f.count} red flags raised on this field`}
                value={<b className="text-[13px] font-semibold text-ink">{f.count}</b>}
              >
                <span className="absolute inset-y-0 left-0 rounded-[2px] bg-accent" style={{ width: `${(100 * f.count) / Math.max(1, list[0].count)}%` }} />
              </BarRow>
            ))}
            {data && data.fields.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-ink-subtle">No mismatches in this scope.</p>
            ) : null}
          </div>
        </InsightPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {breakdown("Department-wise red flags", "Red-flagged of checked.", "department", "department")}
        {breakdown("Location-wise red flags", "Red-flagged of checked.", "location", "location")}
        {breakdown("Compliance nature-wise red flags", "Red-flagged of checked.", "nature", "nature")}
        {breakdown("Submitter-wise red flags", "Who submits the most compliances that need fixing.", "submitter", "submitter")}
        {!scope.clientId && (data?.breakdowns.client.length ?? 0) > 1
          ? breakdown("Client-wise red flags", "Each client's own tool, one LensAI view.", "client")
          : null}
        {breakdown("Entity-wise red flags", "Legal entities within the client.", "entity", "entity")}
      </div>
    </>
  );
}
