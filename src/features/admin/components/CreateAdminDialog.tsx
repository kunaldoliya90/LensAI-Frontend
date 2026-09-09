"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ALL_PERMISSIONS, PERMISSION_LABELS, type Permission } from "@/lib/api/types";
import { createAdmin } from "../api/admin";

export function CreateAdminDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const mutation = useMutation({
    mutationFn: createAdmin,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-admins"] });
      reset();
      onClose();
    },
  });

  const reset = () => {
    setName("");
    setEmail("");
    setPassword("");
    setPermissions([]);
    mutation.reset();
  };

  const toggle = (permission: Permission) =>
    setPermissions((current) =>
      current.includes(permission)
        ? current.filter((value) => value !== permission)
        : [...current, permission],
    );

  const canSubmit = name.trim() !== "" && email.trim() !== "" && password.length >= 12;

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="New admin"
      description="Created with exactly the permissions checked below — nothing is granted by default."
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={!canSubmit || mutation.isPending}
            onClick={() =>
              mutation.mutate({
                name: name.trim(),
                email: email.trim(),
                password,
                permissions,
              })
            }
          >
            {mutation.isPending ? "Creating…" : "Create admin"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {mutation.isError ? <ErrorNotice error={mutation.error} /> : null}

        <Input
          label="Name"
          required
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          hint="At least 12 characters."
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <div>
          <p className="mb-2 text-[13px] font-medium text-ink">Permissions</p>
          <div className="grid gap-2">
            {ALL_PERMISSIONS.map((permission) => (
              <Checkbox
                key={permission}
                label={PERMISSION_LABELS[permission]}
                checked={permissions.includes(permission)}
                onChange={() => toggle(permission)}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
