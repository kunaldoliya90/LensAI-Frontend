import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { Table, TableMessage, TableScroll, Td, Th, Tr } from "@/components/ui/Table";
import { Timestamp } from "@/components/ui/Timestamp";
import type { WebhookEndpointSummary } from "@/lib/api/types";

export function WebhookEndpointsTable({
  endpoints,
  loading,
  rotatingId,
  onRotate,
}: {
  endpoints: WebhookEndpointSummary[];
  loading: boolean;
  rotatingId: string | null;
  onRotate: (endpointId: string) => void;
}) {
  return (
    <TableScroll>
      <Table className="min-w-[56rem]">
        <thead>
          <Tr>
            <Th>URL</Th>
            <Th>Events</Th>
            <Th>Active</Th>
            <Th>Previous secret expires</Th>
            <Th>Created</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </Tr>
        </thead>
        <tbody>
          {loading ? <TableMessage columns={6}>Loading endpoints…</TableMessage> : null}

          {!loading && endpoints.length === 0 ? (
            <TableMessage columns={6}>
              No endpoint registered for this client. Results are still retrievable by polling.
            </TableMessage>
          ) : null}

          {endpoints.map((endpoint) => (
            <Tr key={endpoint.endpoint_id}>
              <Td>
                <span className="font-mono text-[12px] break-all">{endpoint.url}</span>
                {endpoint.description ? (
                  <span className="mt-0.5 block text-[13px] text-ink-muted">
                    {endpoint.description}
                  </span>
                ) : null}
              </Td>
              <Td>
                {endpoint.events.length === 0 ? (
                  <span className="text-ink-muted">All events</span>
                ) : (
                  <span className="grid gap-1">
                    {endpoint.events.map((event) => (
                      <code key={event} className="font-mono text-[12px]">
                        {event}
                      </code>
                    ))}
                  </span>
                )}
              </Td>
              <Td>
                <Pill tone={endpoint.is_active ? "pass" : "neutral"}>
                  {endpoint.is_active ? "Active" : "Inactive"}
                </Pill>
              </Td>
              <Td className="text-ink-muted">
                <Timestamp value={endpoint.previous_secret_expires_at} />
              </Td>
              <Td className="text-ink-muted">
                <Timestamp value={endpoint.created_at} dateOnly />
              </Td>
              <Td>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={rotatingId === endpoint.endpoint_id}
                  onClick={() => onRotate(endpoint.endpoint_id)}
                >
                  {rotatingId === endpoint.endpoint_id ? "Rotating…" : "Rotate secret"}
                </Button>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableScroll>
  );
}
