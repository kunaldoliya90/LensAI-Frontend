"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { SecretOnceModal } from "@/components/SecretOnceModal";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClientSelect } from "@/features/clients/components/ClientSelect";
import { useUrlParams } from "@/hooks/useUrlParams";
import { formatDateTime } from "@/lib/format";
import { listWebhooks, rotateWebhookSecret } from "../api/webhooks";
import { CreateWebhookDialog } from "./CreateWebhookDialog";
import { WebhookEndpointsTable } from "./WebhookEndpointsTable";

interface IssuedSecret {
  secret: string;
  rotated: boolean;
  previousSecretExpiresAt?: string;
}

export function Webhooks() {
  const { params, setParams } = useUrlParams();
  const clientId = params.get("client") ?? "";

  const [creating, setCreating] = useState(false);
  const [issued, setIssued] = useState<IssuedSecret | null>(null);

  const endpoints = useQuery({
    queryKey: ["webhooks", clientId],
    queryFn: () => listWebhooks(clientId),
    enabled: clientId !== "",
  });

  const rotate = useMutation({
    mutationFn: rotateWebhookSecret,
    onSuccess: (result) => {
      endpoints.refetch();
      setIssued({
        secret: result.signing_secret,
        rotated: true,
        previousSecretExpiresAt: result.previous_secret_expires_at,
      });
    },
  });

  return (
    <>
      <PageHeader
        title="Webhooks"
        description="Endpoints are registered per client, so client_id is required to list or create one."
        actions={
          <Button disabled={clientId === ""} onClick={() => setCreating(true)}>
            Register endpoint
          </Button>
        }
      />

      <div className="max-w-sm">
        <ClientSelect value={clientId} onChange={(value) => setParams({ client: value || null })} />
      </div>

      {rotate.isError ? <ErrorNotice error={rotate.error} title="Could not rotate the secret" /> : null}
      {endpoints.isError ? <ErrorNotice error={endpoints.error} /> : null}

      {clientId === "" ? (
        <EmptyState
          title="Select a client"
          description="Webhook endpoints belong to a client. Pick one above to see or register its endpoints."
        />
      ) : (
        <WebhookEndpointsTable
          endpoints={endpoints.data ?? []}
          loading={endpoints.isPending}
          rotatingId={rotate.isPending ? rotate.variables : null}
          onRotate={(endpointId) => rotate.mutate(endpointId)}
        />
      )}

      <Callout tone="neutral" title="Rotation does not break deliveries in flight">
        A rotation issues a new secret and keeps the old one valid for 24 hours. During the overlap
        both are sent as separate <code className="font-mono text-[13px]">v1</code> signatures, so
        your consumer can accept either and you deploy the new secret whenever suits you.
      </Callout>

      <CreateWebhookDialog
        clientId={clientId}
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(created) => {
          setCreating(false);
          setIssued({ secret: created.signing_secret, rotated: false });
        }}
      />

      <SecretOnceModal
        open={issued !== null}
        onDone={() => setIssued(null)}
        title={issued?.rotated ? "New signing secret" : "Webhook signing secret"}
        description="Shown once. It lives in a secret store, never in the database, and cannot be retrieved again."
        secret={issued?.secret ?? ""}
        downloadName="lensai-webhook-secret.txt"
      >
        {issued?.previousSecretExpiresAt ? (
          <Callout tone="warn" title="The previous secret is still accepted">
            Both secrets are sent as separate <code className="font-mono text-[13px]">v1</code>{" "}
            signatures until {formatDateTime(issued.previousSecretExpiresAt)}. Deploy this one
            before then.
          </Callout>
        ) : (
          <Callout tone="neutral">
            Verify <code className="font-mono text-[13px]">{"{timestamp}.{raw_body}"}</code> with
            HMAC-SHA256 against the raw request bytes — never a re-serialized object.
          </Callout>
        )}
      </SecretOnceModal>
    </>
  );
}
