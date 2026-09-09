"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { ALL_PERMISSIONS, PERMISSION_LABELS, type AdminSummary, type Permission } from "@/lib/api/types";
import { updateAdminPermissions } from "../api/admin";

export function AdminPermissionsDialog({
  admin,
  onClose,
}: {
  admin: AdminSummary | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [permissions, setPermissions] = useState<Permission[] | null>(null);

  const current = permissions ?? admin?.permissions ?? [];

  const mutation = useMutation({
    mutationFn: updateAdminPermissions,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-admins"] });
      setPermissions(null);
      onClose();
    },
  });

  const toggle = (permission: Permission) =>
    setPermissions(
      current.includes(permission)
        ? current.filter((value) => value !== permission)
        : [...current, permission],
    );

  return (
    <Modal
      open={admin !== null}
      onClose={() => {
        setPermissions(null);
        onClose();
      }}
      title="Edit permissions"
      description={admin ? `${admin.name} — ${admin.email}` : undefined}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              setPermissions(null);
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={mutation.isPending}
            onClick={() =>
              admin && mutation.mutate({ userId: admin.user_id, permissions: current })
            }
          >
            {mutation.isPending ? "Saving…" : "Save permissions"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {mutation.isError ? <ErrorNotice error={mutation.error} /> : null}

        <div className="grid gap-2">
          {ALL_PERMISSIONS.map((permission) => (
            <Checkbox
              key={permission}
              label={PERMISSION_LABELS[permission]}
              checked={current.includes(permission)}
              onChange={() => toggle(permission)}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}
