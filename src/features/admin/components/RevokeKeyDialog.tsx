"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import type { PendingApiKey } from "@/lib/api/types";
import { revokeAnyApiKey } from "../api/admin";

export function RevokeKeyDialog({
  apiKey,
  onClose,
}: {
  apiKey: PendingApiKey | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: revokeAnyApiKey,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-api-keys"] });
      setReason("");
      onClose();
    },
  });

  return (
    <Modal
      open={apiKey !== null}
      onClose={onClose}
      title="Revoke API key"
      description={apiKey ? `${apiKey.tenant_name} — ${apiKey.name}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={reason.trim() === "" || mutation.isPending}
            onClick={() =>
              apiKey && mutation.mutate({ apiKeyId: apiKey.api_key_id, reason: reason.trim() })
            }
          >
            {mutation.isPending ? "Revoking…" : "Revoke key"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {mutation.isError ? <ErrorNotice error={mutation.error} /> : null}

        <Textarea
          label="Reason"
          required
          rows={3}
          maxLength={500}
          hint="Required, 1–500 characters. Kept on the audit record."
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />

        <Callout tone="neutral">
          Takes effect on the tenant&rsquo;s next request. The key cannot be reinstated — they would
          need to request a new one.
        </Callout>
      </div>
    </Modal>
  );
}
