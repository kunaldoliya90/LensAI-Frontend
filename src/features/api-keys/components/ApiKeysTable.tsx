import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/Button";
import { Table, TableMessage, TableScroll, Td, Th, Tr } from "@/components/ui/Table";
import { Timestamp } from "@/components/ui/Timestamp";
import type { ApiKeySummary } from "@/lib/api/types";

const REVOCABLE = new Set(["PENDING", "ACTIVE"]);

export function ApiKeysTable({
  apiKeys,
  loading,
  onRevoke,
}: {
  apiKeys: ApiKeySummary[];
  loading: boolean;
  onRevoke: (apiKey: ApiKeySummary) => void;
}) {
  return (
    <TableScroll>
      <Table className="min-w-[64rem]">
        <thead>
          <Tr>
            <Th>Name</Th>
            <Th>Prefix</Th>
            <Th>Environment</Th>
            <Th>Status</Th>
            <Th>Tier</Th>
            <Th>Created</Th>
            <Th>Approved</Th>
            <Th>Expires</Th>
            <Th>Last used</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </Tr>
        </thead>
        <tbody>
          {loading ? <TableMessage columns={10}>Loading keys…</TableMessage> : null}

          {!loading && apiKeys.length === 0 ? (
            <TableMessage columns={10}>
              No keys yet. Request one, then ask a LensAI administrator to approve it.
            </TableMessage>
          ) : null}

          {apiKeys.map((apiKey) => (
            <Tr key={apiKey.api_key_id}>
              <Td className="font-medium">{apiKey.name}</Td>
              <Td>
                <code className="font-mono text-[12px]">{apiKey.key_prefix}…</code>
              </Td>
              <Td>
                <StatusPill value={apiKey.environment} />
              </Td>
              <Td>
                <StatusPill value={apiKey.status} />
              </Td>
              <Td className="text-ink-muted">{apiKey.rate_limit_tier}</Td>
              <Td className="text-ink-muted">
                <Timestamp value={apiKey.created_at} dateOnly />
              </Td>
              <Td className="text-ink-muted">
                <Timestamp value={apiKey.approved_at} dateOnly />
              </Td>
              <Td className="text-ink-muted">
                <Timestamp value={apiKey.expires_at} dateOnly />
              </Td>
              <Td className="text-ink-muted">
                <Timestamp value={apiKey.last_used_at} />
              </Td>
              <Td>
                {REVOCABLE.has(apiKey.status) ? (
                  <Button variant="secondary" size="sm" onClick={() => onRevoke(apiKey)}>
                    Revoke
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
