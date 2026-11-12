"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Table, TableMessage, TableScroll, Td, Th } from "@/components/ui/Table";
import { useUrlParams } from "@/hooks/useUrlParams";
import { isStaff } from "@/lib/auth/session";
import { useSession } from "@/lib/auth/useSession";
import { formatDate, formatInteger } from "@/lib/format";
import type { InsightClientUsage } from "@/lib/api/types";
import { getUsage } from "../api/insights";
import { formatRate, formatSeconds, readScope } from "../scope";
import { InsightPanel, Kpi, KpiStrip, Legend, SERIES, StackedMonthly } from "./charts";
import { InsightsScopeBar } from "./InsightsScopeBar";

/**
 * How much each client uses LensAI: volume, speed and reliability. Staff see
 * clients grouped under the tenant whose tool sends them. Token billing lives
 * on its own page; this is about verifications, not invoices.
 */
export function Usage() {
  const session = useSession();
  const staff = isStaff(session);
  const { params } = useUrlParams();
  const scope = readScope(params, staff);

  const usage = useQuery({
    queryKey: ["insights", "usage", { ...scope, filters: {} }],
    queryFn: () => getUsage(scope),
    placeholderData: keepPreviousData,
  });
  const data = usage.data;
  const kpis = data?.kpis;

  const colorOf = new Map((data?.clients ?? []).map((c, i) => [c.client_id, SERIES[i % SERIES.length]]));
  // Client names repeat across tenants, so staff see the tenant beside each.
  const series = (data?.clients ?? []).map((c) => ({
    key: c.client_id,
    label: staff ? `${c.name} · ${c.tenant_name}` : c.name,
    color: colorOf.get(c.client_id) ?? SERIES[0],
  }));
  const months = (data?.monthly ?? []).map((m) => ({
    month: m.month,
    label: m.label,
    partial: m.partial,
    values: Object.fromEntries(m.by_client.map((c) => [c.client_id, c.count])),
  }));
  const currentMonth = data?.months.at(-1)?.label ?? "This month";
  const tenants = groupByTenant(data?.clients ?? []);

  return (
    <>
      <InsightsScopeBar />

      <div className="pb-1">
        <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">Usage</h1>
        <p className="mt-1 max-w-[75ch] text-[13.5px] text-ink-muted">
          How much each {staff ? "tenant and " : ""}client uses LensAI: volume, speed and reliability.
          {staff ? " Clients are grouped under the tenant whose tool sends them." : ""}
        </p>
      </div>

      {usage.error ? <ErrorNotice error={usage.error} /> : null}

      <KpiStrip>
        <Kpi label="Verifications" value={formatInteger(kpis?.verifications ?? 0)} note={`Last ${scope.months} months`} />
        <Kpi label="Pages read by AI" value={formatInteger(kpis?.pages ?? 0)} note={`${(kpis?.pages_per_verification ?? 0).toFixed(1)} per compliance`} />
        <Kpi tone="good" label="Success rate" value={formatRate(kpis?.success_rate ?? 0)} note={`${kpis?.failed ?? 0} jobs failed and were returned`} />
        <Kpi label="Avg. turnaround" value={formatSeconds(kpis?.avg_turnaround_seconds ?? null)} note="Submission to result" />
        <Kpi
          label="Active clients"
          value={formatInteger(kpis?.active_clients ?? 0)}
          note={staff ? `Across ${kpis?.tenants ?? 0} ${kpis?.tenants === 1 ? "tenant" : "tenants"}` : "With at least one verification"}
        />
      </KpiStrip>

      <InsightPanel
        title="Verifications by month"
        sub="Stacked by client. Growth shows clients being onboarded."
        aside={<Legend items={series.map((s) => ({ key: s.key, label: s.label, color: s.color }))} />}
      >
        <StackedMonthly months={months} series={series} />
        <p className="mt-1 text-[12.5px] text-ink-subtle">* Current month to date.</p>
      </InsightPanel>

      <InsightPanel
        title={staff ? "Tenant and client usage" : "Client usage"}
        sub={`Quota column shows ${currentMonth} against each client's monthly plan.`}
      >
        <TableScroll className="rounded-md shadow-none">
          <Table>
            <thead>
              <tr>
                <Th>Client</Th>
                <Th>Onboarded</Th>
                <Th>Verifications</Th>
                <Th>Red-flag rate</Th>
                <Th>Avg. time</Th>
                <Th>Failed jobs</Th>
                <Th>{currentMonth.slice(0, 3)} quota used</Th>
              </tr>
            </thead>
            <tbody>
              {usage.isPending ? <TableMessage columns={7}>Loading…</TableMessage> : null}
              {data && data.clients.length === 0 ? (
                <TableMessage columns={7}>No verifications in this period.</TableMessage>
              ) : null}
              {tenants.map(([tenantId, clients]) => (
                <TenantRows key={tenantId} name={clients[0].tenant_name} clients={clients} showHeader={staff} colorOf={colorOf} />
              ))}
            </tbody>
          </Table>
        </TableScroll>
      </InsightPanel>
    </>
  );
}

/** Grouped by tenant id, not name: two tenants may share a name. */
function groupByTenant(clients: InsightClientUsage[]): [string, InsightClientUsage[]][] {
  const groups = new Map<string, InsightClientUsage[]>();
  for (const client of clients) {
    groups.set(client.tenant_id, [...(groups.get(client.tenant_id) ?? []), client]);
  }
  return [...groups.entries()];
}

function TenantRows({
  name,
  clients,
  showHeader,
  colorOf,
}: {
  name: string;
  clients: InsightClientUsage[];
  showHeader: boolean;
  colorOf: Map<string, string>;
}) {
  const verifications = clients.reduce((sum, c) => sum + c.verifications, 0);
  const flagged = clients.reduce((sum, c) => sum + (c.red_flag_rate * c.verifications) / 100, 0);
  const timed = clients.filter((c) => c.avg_turnaround_seconds !== null);
  const avg = timed.length
    ? timed.reduce((sum, c) => sum + (c.avg_turnaround_seconds ?? 0) * c.verifications, 0) /
      Math.max(1, timed.reduce((sum, c) => sum + c.verifications, 0))
    : null;

  return (
    <>
      {showHeader ? (
        <tr className="border-b border-line bg-deep-2 font-semibold">
          <Td colSpan={2}>
            {name}{" "}
            <span className="text-[12px] font-normal text-ink-subtle">
              · tenant · {clients.length} {clients.length === 1 ? "client" : "clients"}
            </span>
          </Td>
          <Td>{formatInteger(verifications)}</Td>
          <Td>{formatRate(verifications ? (100 * flagged) / verifications : 0)}</Td>
          <Td>{formatSeconds(avg)}</Td>
          <Td>{clients.reduce((sum, c) => sum + c.failed, 0)}</Td>
          <Td />
        </tr>
      ) : null}
      {clients.map((c) => (
        <tr key={c.client_id} className="border-b border-line last:border-b-0">
          <Td>
            <span className="mr-2 inline-block size-2 rounded-[2px]" style={{ background: colorOf.get(c.client_id) }} />
            {c.name}
          </Td>
          <Td className="text-[12px] text-ink-subtle">{formatDate(c.onboarded_at)}</Td>
          <Td>{formatInteger(c.verifications)}</Td>
          <Td>{formatRate(c.red_flag_rate)}</Td>
          <Td>{formatSeconds(c.avg_turnaround_seconds)}</Td>
          <Td>{c.failed}</Td>
          <Td>
            {c.monthly_quota ? (
              <div className="flex items-center gap-2">
                <div className="h-1.5 min-w-20 flex-1 overflow-hidden rounded-[2px] bg-[var(--chart-track)]">
                  <i className="block h-full bg-accent" style={{ width: `${Math.min(100, (100 * c.current_month) / c.monthly_quota)}%` }} />
                </div>
                <span className="text-[12px] text-ink-subtle tabular-nums">
                  {c.current_month} / {c.monthly_quota}
                </span>
              </div>
            ) : (
              <span className="text-[12px] text-ink-subtle">{c.current_month} · no plan set</span>
            )}
          </Td>
        </tr>
      ))}
    </>
  );
}
