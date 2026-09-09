"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { SecretOnceModal } from "@/components/SecretOnceModal";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { PageHeader } from "@/components/ui/PageHeader";
import type { ApiKeyIssued, ApiKeySummary } from "@/lib/api/types";
import { listApiKeys } from "../api/apiKeys";
import { ApiKeysTable } from "./ApiKeysTable";
import { CreateApiKeyDialog } from "./CreateApiKeyDialog";
import { RevokeApiKeyDialog } from "./RevokeApiKeyDialog";

export function ApiKeys() {
  const [creating, setCreating] = useState(false);
  const [issued, setIssued] = useState<ApiKeyIssued | null>(null);
  const [revoking, setRevoking] = useState<ApiKeySummary | null>(null);

  const apiKeys = useQuery({ queryKey: ["api-keys"], queryFn: listApiKeys });

  return (
    <>
      <PageHeader
        title="API keys"
        description="The credential your backend sends as x-api-key. Environment and rate-limit tier are attributes of the key."
        actions={<Button onClick={() => setCreating(true)}>Request key</Button>}
      />

      {apiKeys.isError ? <ErrorNotice error={apiKeys.error} /> : null}

      <ApiKeysTable
        apiKeys={apiKeys.data ?? []}
        loading={apiKeys.isPending}
        onRevoke={setRevoking}
      />

      <Callout tone="neutral" title="Why a key can be listed but still not work">
        A key is issued PENDING and does not authenticate until a LensAI administrator approves it —
        calls return <code className="font-mono text-[13px]">403 api_key_pending_approval</code>{" "}
        until then. The plaintext is never recoverable after creation; only the prefix shown here is
        stored.
      </Callout>

      <CreateApiKeyDialog
        open={creating}
        onClose={() => setCreating(false)}
        onIssued={(key) => {
          setCreating(false);
          setIssued(key);
        }}
      />

      <SecretOnceModal
        open={issued !== null}
        onDone={() => setIssued(null)}
        title="Your API key"
        description="This is the only time LensAI will show it. Store it in your secret manager now."
        secret={issued?.plaintext_key ?? ""}
        downloadName={`lensai-api-key-${issued?.key_prefix ?? "key"}.txt`}
      >
        <Callout tone="warn">{issued?.message}</Callout>
      </SecretOnceModal>

      <RevokeApiKeyDialog apiKey={revoking} onClose={() => setRevoking(null)} />
    </>
  );
}
