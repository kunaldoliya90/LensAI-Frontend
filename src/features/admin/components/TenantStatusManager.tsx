"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { Table, TableMessage, TableScroll, Td, Th, Tr } from "@/components/ui/Table";
import { Textarea } from "@/components/ui/Textarea";
import type { TenantStatus } from "@/lib/api/types";
import { listTenants, setTenantStatus } from "../api/admin";

const STATUSES: TenantStatus[] = ["ACTIVE", "INACTIVE", "SUSPENDED"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function TenantStatusManager() {
  const queryClient = useQueryClient();
  const [tenantId, setTenantId] = useState("");
  const [status, setStatus] = useState<TenantStatus>("SUSPENDED");
  const [reason, setReason] = useState("");

  const tenantsQuery = useQuery({
    queryKey: ["admin-tenants", 500],
    queryFn: () => listTenants({ limit: 500 }),
  });

  const tenants = [...(tenantsQuery.data ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  const mutation = useMutation({
    mutationFn: setTenantStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-tenants"] }),
  });
  const invalidId = tenantId !== "" && !UUID.test(tenantId);

  return (
    <>
      <PageHeader
        title="Tenants"
        description="Suspension is the non-payment lever: it blocks every API call for a tenant from the next request, without touching their keys or their data."
      />

      {mutation.isError ? <ErrorNotice error={mutation.error} /> : null}

      {mutation.isSuccess ? (
        <Callout tone="pass" title="Status changed">
          <p className="flex flex-wrap items-center gap-2">
            <StatusPill value={mutation.data.previous_status} /> →{" "}
            <StatusPill value={mutation.data.status} />
          </p>
          <p className="mt-2">
            API keys may keep authenticating for up to {mutation.data.cache_ttl_seconds} seconds
            because the auth record is cached. Portal sessions are unaffected until their own token
            expires.
          </p>
        </Callout>
      ) : null}

      <section className="grid max-w-2xl gap-4 panel p-4">
        <Input
          label="tenant_id"
          required
          mono
          placeholder="00000000-0000-4000-8000-000000000000"
          hint="A UUID. Paste one or pick from the table below."
          error={invalidId ? "That is not a UUID." : undefined}
          value={tenantId}
          onChange={(event) => setTenantId(event.target.value.trim())}
        />

        <Select
          label="New status"
          required
          value={status}
          onChange={(event) => setStatus(event.target.value as TenantStatus)}
        >
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>

        <Textarea
          label="Reason"
          required
          rows={3}
          maxLength={500}
          hint="Required, 1–500 characters. Recorded against the change."
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />

        <div>
          <Button
            variant={status === "ACTIVE" ? "primary" : "danger"}
            disabled={!UUID.test(tenantId) || reason.trim() === "" || mutation.isPending}
            onClick={() => mutation.mutate({ tenantId, status, reason: reason.trim() })}
          >
            {mutation.isPending ? "Applying…" : `Set ${status}`}
          </Button>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[12.5px] font-medium">Every tenant</h2>
        <TableScroll>
          <Table className="min-w-[44rem]">
            <thead>
              <Tr>
                <Th>Tenant</Th>
                <Th>tenant_id</Th>
                <Th>Status</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </Tr>
            </thead>
            <tbody>
              {tenantsQuery.isPending ? <TableMessage columns={4}>Loading…</TableMessage> : null}

              {!tenantsQuery.isPending && tenants.length === 0 ? (
                <TableMessage columns={4}>No tenants yet.</TableMessage>
              ) : null}

              {tenants.map((tenant) => (
                <Tr key={tenant.tenant_id}>
                  <Td className="font-medium">{tenant.name}</Td>
                  <Td className="font-mono text-[12px]">{tenant.tenant_id}</Td>
                  <Td>
                    <StatusPill value={tenant.status} />
                  </Td>
                  <Td>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setTenantId(tenant.tenant_id)}
                    >
                      Use this id
                    </Button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableScroll>
      </section>
    </>
  );
}
