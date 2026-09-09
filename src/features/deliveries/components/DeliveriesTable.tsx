import Link from "next/link";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/Button";
import { CopyValue } from "@/components/ui/CopyValue";
import { Table, TableMessage, TableScroll, Td, Th, Tr } from "@/components/ui/Table";
import { Timestamp } from "@/components/ui/Timestamp";
import type { DeliverySummary } from "@/lib/api/types";

const SETTLED = new Set(["SUCCESS", "FAILED"]);

export function DeliveriesTable({
  deliveries,
  loading,
  replayingId,
  canOpenInPlayground,
  onReplay,
}: {
  deliveries: DeliverySummary[];
  loading: boolean;
  replayingId: string | null;
  canOpenInPlayground: boolean;
  onReplay: (logId: string) => void;
}) {
  return (
    <TableScroll>
      <Table className="min-w-[78rem]">
        <thead>
          <Tr>
            <Th>Created</Th>
            <Th>Event</Th>
            <Th>Status</Th>
            <Th>Attempts</Th>
            <Th>HTTP</Th>
            <Th>Endpoint</Th>
            <Th>Error</Th>
            <Th>Next retry</Th>
            <Th>Verification</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </Tr>
        </thead>
        <tbody>
          {loading ? <TableMessage columns={10}>Loading deliveries…</TableMessage> : null}

          {!loading && deliveries.length === 0 ? (
            <TableMessage columns={10}>
              No deliveries match these filters. Nothing has been sent for this account yet, or the
              filter is too narrow.
            </TableMessage>
          ) : null}

          {deliveries.map((delivery) => (
            <Tr key={delivery.log_id}>
              <Td className="text-ink-muted">
                <Timestamp value={delivery.created_at} />
              </Td>
              <Td>
                <code className="font-mono text-[12px]">{delivery.event_type}</code>
                <span className="mt-0.5 block">
                  <CopyValue value={delivery.event_id} truncate />
                </span>
              </Td>
              <Td>
                <StatusPill value={delivery.status} />
              </Td>
              <Td className="text-ink-muted">{delivery.attempts}</Td>
              <Td className="text-ink-muted">{delivery.http_status_code ?? "—"}</Td>
              <Td>
                <span className="block max-w-[22ch] truncate font-mono text-[12px]" title={delivery.webhook_url}>
                  {delivery.webhook_url}
                </span>
              </Td>
              <Td className="max-w-[24ch] text-[13px] text-fail">{delivery.error_message ?? "—"}</Td>
              <Td className="text-ink-muted">
                <Timestamp value={delivery.next_retry_at} />
              </Td>
              <Td>
                {canOpenInPlayground ? (
                  <Link
                    href={`/app/playground?verification=${delivery.verification_id}`}
                    className="text-[13px] text-accent-bright underline underline-offset-2"
                  >
                    Open in playground
                  </Link>
                ) : (
                  <CopyValue value={delivery.verification_id} truncate />
                )}
              </Td>
              <Td>
                {SETTLED.has(delivery.status) ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={replayingId === delivery.log_id}
                    onClick={() => onReplay(delivery.log_id)}
                  >
                    {replayingId === delivery.log_id ? "Queuing…" : "Replay"}
                  </Button>
                ) : null}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableScroll>
  );
}
