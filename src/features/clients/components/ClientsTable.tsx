import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CopyValue } from "@/components/ui/CopyValue";
import { Table, TableMessage, TableScroll, Td, Th, Tr } from "@/components/ui/Table";
import { Timestamp } from "@/components/ui/Timestamp";
import type { ClientSummary } from "@/lib/api/types";

export function ClientsTable({
  clients,
  loading,
  onCreate,
}: {
  clients: ClientSummary[];
  loading: boolean;
  onCreate: () => void;
}) {
  return (
    <TableScroll>
      <Table className="min-w-[42rem]">
        <thead>
          <Tr>
            <Th>Name</Th>
            <Th>client_id</Th>
            <Th>Contact email</Th>
            <Th>Created</Th>
          </Tr>
        </thead>
        <tbody>
          {loading ? <TableMessage columns={4}>Loading clients…</TableMessage> : null}

          {!loading && clients.length === 0 ? (
            <TableMessage columns={4}>
              <span className="block">
                No clients yet. Create one before uploading a document or registering a webhook.
              </span>
              <Button size="sm" className="mt-3" onClick={onCreate}>
                <Plus aria-hidden className="size-4" />
                Create your first client
              </Button>
            </TableMessage>
          ) : null}

          {clients.map((client) => (
            <Tr key={client.client_id}>
              <Td className="font-medium">{client.name}</Td>
              <Td>
                <CopyValue value={client.client_id} copyLabel="Copy" />
              </Td>
              <Td className="text-ink-muted">{client.contact_email ?? "—"}</Td>
              <Td className="text-ink-muted">
                <Timestamp value={client.created_at} />
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableScroll>
  );
}
