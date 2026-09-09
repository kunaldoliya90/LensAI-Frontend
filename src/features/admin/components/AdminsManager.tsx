"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { Table, TableMessage, TableScroll, Td, Th, Tr } from "@/components/ui/Table";
import { Timestamp } from "@/components/ui/Timestamp";
import { PERMISSION_LABELS, type AdminSummary } from "@/lib/api/types";
import { listAdmins, setAdminStatus } from "../api/admin";
import { AdminPermissionsDialog } from "./AdminPermissionsDialog";
import { CreateAdminDialog } from "./CreateAdminDialog";

export function AdminsManager() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminSummary | null>(null);

  const admins = useQuery({ queryKey: ["admin-admins"], queryFn: listAdmins });

  const status = useMutation({
    mutationFn: setAdminStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-admins"] }),
  });

  const rows = [...(admins.data ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <PageHeader
        title="Admins"
        description="There is exactly one super admin, bootstrapped at deployment. Every other admin is created here, with exactly the permissions checked at creation — never full access by default."
        actions={<Button onClick={() => setCreating(true)}>New admin</Button>}
      />

      {admins.isError ? <ErrorNotice error={admins.error} /> : null}
      {status.isError ? <ErrorNotice error={status.error} title="Could not change status" /> : null}

      <TableScroll>
        <Table className="min-w-[56rem]">
          <thead>
            <Tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Status</Th>
              <Th>Permissions</Th>
              <Th>Last login</Th>
              <Th>
                <span className="sr-only">Actions</span>
              </Th>
            </Tr>
          </thead>
          <tbody>
            {admins.isPending ? <TableMessage columns={6}>Loading…</TableMessage> : null}

            {!admins.isPending && rows.length === 0 ? (
              <TableMessage columns={6}>No admins created yet.</TableMessage>
            ) : null}

            {rows.map((admin) => (
              <Tr key={admin.user_id}>
                <Td className="font-medium">{admin.name}</Td>
                <Td>{admin.email}</Td>
                <Td>
                  <StatusPill value={admin.status} />
                </Td>
                <Td>
                  <span className="flex flex-wrap gap-1">
                    {admin.permissions.length === 0 ? (
                      <span className="text-ink-subtle">None</span>
                    ) : (
                      admin.permissions.map((permission) => (
                        <Pill key={permission}>{PERMISSION_LABELS[permission]}</Pill>
                      ))
                    )}
                  </span>
                </Td>
                <Td className="text-ink-muted">
                  {admin.last_login_at ? <Timestamp value={admin.last_login_at} /> : "Never"}
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setEditing(admin)}>
                      Edit permissions
                    </Button>
                    <Button
                      variant={admin.status === "ACTIVE" ? "danger" : "secondary"}
                      size="sm"
                      disabled={status.isPending}
                      onClick={() =>
                        status.mutate({
                          userId: admin.user_id,
                          status: admin.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                        })
                      }
                    >
                      {admin.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableScroll>

      <Callout tone="neutral" title="Role and permissions are re-read on every request">
        Deactivating an admin, or narrowing what it can manage, takes effect on its very next call —
        there is no cached session to wait out.
      </Callout>

      <CreateAdminDialog open={creating} onClose={() => setCreating(false)} />
      <AdminPermissionsDialog admin={editing} onClose={() => setEditing(null)} />
    </>
  );
}
