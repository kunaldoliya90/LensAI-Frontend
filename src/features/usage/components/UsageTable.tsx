import { Pill } from "@/components/ui/Pill";
import { Table, TableMessage, TableScroll, Td, Th, Tr } from "@/components/ui/Table";
import { formatDate, formatInteger } from "@/lib/format";
import type { UsageLine } from "@/lib/api/types";
import { COUNTERS } from "../usageCounters";

export function UsageTable({
  lines,
  loading,
  showTenant,
}: {
  lines: UsageLine[];
  loading: boolean;
  showTenant?: boolean;
}) {
  const columns = COUNTERS.length + (showTenant ? 3 : 2);

  return (
    <TableScroll>
      <Table className="min-w-[68rem]">
        <thead>
          <Tr>
            <Th>Date</Th>
            {showTenant ? <Th>Tenant</Th> : null}
            <Th>Scope</Th>
            {COUNTERS.map((counter) => (
              <Th key={counter.key} className="text-right">
                {counter.label}
              </Th>
            ))}
            <Th>Template</Th>
          </Tr>
        </thead>
        <tbody>
          {loading ? <TableMessage columns={columns + 1}>Loading usage…</TableMessage> : null}

          {!loading && lines.length === 0 ? (
            <TableMessage columns={columns + 1}>
              No usage recorded in this period.
            </TableMessage>
          ) : null}

          {lines.map((line, index) => (
            <Tr key={`${line.usage_date}-${line.provider_scope}-${line.template_key}-${line.tenant_id ?? index}`}>
              <Td className="whitespace-nowrap text-ink-muted">{formatDate(line.usage_date)}</Td>
              {showTenant ? (
                <Td className="font-medium">{line.tenant_name ?? line.tenant_id ?? "—"}</Td>
              ) : null}
              <Td>
                <Pill tone={line.provider_scope === "PLATFORM" ? "info" : "neutral"}>
                  {line.provider_scope}
                </Pill>
              </Td>
              {COUNTERS.map((counter) => (
                <Td key={counter.key} className="text-right font-mono tabular-nums">
                  {formatInteger(line[counter.key])}
                </Td>
              ))}
              <Td className="font-mono text-[12px]">{line.template_key}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableScroll>
  );
}
