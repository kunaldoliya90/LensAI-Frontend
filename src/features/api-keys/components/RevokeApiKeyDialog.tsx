"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import type { ApiKeySummary } from "@/lib/api/types";
import { revokeApiKey } from "../api/apiKeys";

export function RevokeApiKeyDialog({
  apiKey,
  onClose,
}: {
  apiKey: ApiKeySummary | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      setReason("");
      onClose();
    },
  });

  return (
    <Modal
      open={apiKey !== null}
      onClose={onClose}
      title={`Revoke ${apiKey?.name ?? ""}`}
      description="Revocation is immediate and permanent. Any integration still using this key starts failing on its next call."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={reason.trim().length === 0 || mutation.isPending}
            onClick={() => {
              if (apiKey) mutation.mutate({ apiKeyId: apiKey.api_key_id, reason: reason.trim() });
            }}
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
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          hint="Required by the API and kept on the audit record. 1–500 characters."
        />

        <Callout tone="neutral">
          Revoked and rejected are the same terminal state: the key hash simply never validates
          again. There is no un-revoke — issue a new key instead.
        </Callout>
      </div>
    </Modal>
  );
}
