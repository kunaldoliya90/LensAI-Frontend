"use client";

import { useQuery } from "@tanstack/react-query";
import { ErrorNotice } from "@/components/ErrorNotice";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { Table, TableMessage, TableScroll, Td, Th, Tr } from "@/components/ui/Table";
import { Timestamp } from "@/components/ui/Timestamp";
import { useUrlParams } from "@/hooks/useUrlParams";
import { listAllClients, listTenants } from "../api/admin";

export function ClientsDirectory() {
  const { params, setParams } = useUrlParams();
  const tenantId = params.get("tenant") ?? "";

  const tenants = useQuery({
    queryKey: ["admin-tenants", 500],
    queryFn: () => listTenants({ limit: 500 }),
  });

  const clients = useQuery({
    queryKey: ["admin-clients", tenantId || null],
    queryFn: () => listAllClients({ tenantId: tenantId || undefined, limit: 500 }),
  });

  const rows = [...(clients.data ?? [])].sort(
    (a, b) => a.tenant_name.localeCompare(b.tenant_name) || a.name.localeCompare(b.name),
  );

  return (
    <>
      <PageHeader
        title="Clients"
        description="Every client across every tenant. Staff have no client list of their own — a client is always someone's product configuration, viewed here to help set it up or investigate it."
      />

      <div className="max-w-xs">
        <Select
          label="Tenant"
          value={tenantId}
          onChange={(event) => setParams({ tenant: event.target.value || null })}
        >
          <option value="">All tenants</option>
          {tenants.data?.map((tenant) => (
            <option key={tenant.tenant_id} value={tenant.tenant_id}>
              {tenant.name}
            </option>
          ))}
        </Select>
      </div>

      {tenants.isError ? <ErrorNotice error={tenants.error} /> : null}
      {clients.isError ? <ErrorNotice error={clients.error} /> : null}

      <TableScroll>
        <Table className="min-w-[52rem]">
          <thead>
            <Tr>
              <Th>Tenant</Th>
              <Th>Client</Th>
              <Th>Contact email</Th>
              <Th>Created</Th>
            </Tr>
          </thead>
          <tbody>
            {clients.isPending ? <TableMessage columns={4}>Loading…</TableMessage> : null}

            {!clients.isPending && rows.length === 0 ? (
              <TableMessage columns={4}>No clients for this scope.</TableMessage>
            ) : null}

            {rows.map((client) => (
              <Tr key={client.client_id}>
                <Td className="font-medium">{client.tenant_name}</Td>
                <Td>{client.name}</Td>
                <Td className="text-ink-muted">{client.contact_email ?? "—"}</Td>
                <Td className="text-ink-muted">
                  <Timestamp value={client.created_at} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableScroll>
    </>
  );
}
