"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import {
  RATE_LIMIT_PER_MINUTE,
  RATE_LIMIT_TIERS,
  type PendingApiKey,
  type RateLimitTier,
} from "@/lib/api/types";
import { approveApiKey } from "../api/admin";

export function ApproveKeyDialog({
  apiKey,
  onClose,
}: {
  apiKey: PendingApiKey | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [tier, setTier] = useState<RateLimitTier>("standard");
  const [expiresAt, setExpiresAt] = useState("");

  const mutation = useMutation({
    mutationFn: approveApiKey,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-api-keys"] });
      onClose();
    },
  });

  const perMinute = RATE_LIMIT_PER_MINUTE[tier];

  return (
    <Modal
      open={apiKey !== null}
      onClose={onClose}
      title="Approve API key"
      description={
        apiKey ? `${apiKey.tenant_name} — ${apiKey.name} (${apiKey.environment})` : undefined
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={mutation.isPending}
            onClick={() =>
              apiKey &&
              mutation.mutate({
                apiKeyId: apiKey.api_key_id,
                rateLimitTier: tier,
                // datetime-local has no zone; the API wants an instant.
                expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
              })
            }
          >
            {mutation.isPending ? "Approving…" : "Approve key"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {mutation.isError ? <ErrorNotice error={mutation.error} /> : null}

        <Select
          label="Rate limit tier"
          required
          hint={
            perMinute === null
              ? "No rate limit is applied to this key."
              : `${perMinute} requests per minute, enforced per key rather than per tenant.`
          }
          value={tier}
          onChange={(event) => setTier(event.target.value as RateLimitTier)}
        >
          {RATE_LIMIT_TIERS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>

        <Input
          label="Expires at"
          type="datetime-local"
          hint="Optional. Leave empty for a key that does not expire."
          value={expiresAt}
          onChange={(event) => setExpiresAt(event.target.value)}
        />

        <Callout tone="neutral">
          Approval takes effect on the tenant&rsquo;s next request. The plaintext key was shown to
          them once at creation and is not recoverable here.
        </Callout>
      </div>
    </Modal>
  );
}
