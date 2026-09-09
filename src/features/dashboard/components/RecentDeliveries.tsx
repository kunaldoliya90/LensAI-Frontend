"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ErrorNotice } from "@/components/ErrorNotice";
import { StatusPill } from "@/components/StatusPill";
import { Table, TableMessage, TableScroll, Td, Th, Tr } from "@/components/ui/Table";
import { Timestamp } from "@/components/ui/Timestamp";
import { listDeliveries } from "@/features/deliveries/api/deliveries";

export function RecentDeliveries() {
  const deliveries = useQuery({
    queryKey: ["deliveries", "", "", 10],
    queryFn: () => listDeliveries({ limit: 10 }),
  });

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[12.5px] font-medium">Recent webhook deliveries</h2>
        <Link href="/app/deliveries" className="text-[13px] text-accent-bright underline underline-offset-2">
          All deliveries
        </Link>
      </div>

      {deliveries.isError ? <ErrorNotice error={deliveries.error} /> : null}

      <TableScroll>
        <Table className="min-w-[46rem]">
          <thead>
            <Tr>
              <Th>Created</Th>
              <Th>Event</Th>
              <Th>Status</Th>
              <Th>Attempts</Th>
              <Th>HTTP</Th>
              <Th>Endpoint</Th>
            </Tr>
          </thead>
          <tbody>
            {deliveries.isPending ? <TableMessage columns={6}>Loading…</TableMessage> : null}

            {!deliveries.isPending && (deliveries.data?.length ?? 0) === 0 ? (
              <TableMessage columns={6}>
                Nothing delivered yet. Register an endpoint on Webhooks, or poll for results.
              </TableMessage>
            ) : null}

            {deliveries.data?.map((delivery) => (
              <Tr key={delivery.log_id}>
                <Td className="text-ink-muted">
                  <Timestamp value={delivery.created_at} />
                </Td>
                <Td className="font-mono text-[12px]">{delivery.event_type}</Td>
                <Td>
                  <StatusPill value={delivery.status} />
                </Td>
                <Td className="text-ink-muted">{delivery.attempts}</Td>
                <Td className="text-ink-muted">{delivery.http_status_code ?? "—"}</Td>
                <Td>
                  <span className="block max-w-[26ch] truncate font-mono text-[12px]" title={delivery.webhook_url}>
                    {delivery.webhook_url}
                  </span>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableScroll>
    </section>
  );
}
