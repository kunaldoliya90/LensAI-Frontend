"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { PageHeader } from "@/components/ui/PageHeader";
import type { ProviderRegistered } from "@/lib/api/types";
import {
  checkProviderHealth,
  disableProvider,
  listProviders,
  setDefaultProvider,
} from "../api/providers";
import { DataPolicyCard } from "./DataPolicyCard";
import { ProvidersTable } from "./ProvidersTable";
import { RegisterProviderDialog } from "./RegisterProviderDialog";

export function AiProviders() {
  const queryClient = useQueryClient();
  const [registering, setRegistering] = useState(false);
  const [lastProbe, setLastProbe] = useState<ProviderRegistered | null>(null);

  const routing = useQuery({ queryKey: ["ai-providers"], queryFn: listProviders });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["ai-providers"] });

  const health = useMutation({
    mutationFn: checkProviderHealth,
    onSuccess: async (result) => {
      setLastProbe(result);
      await invalidate();
    },
  });

  const makeDefault = useMutation({ mutationFn: setDefaultProvider, onSuccess: invalidate });
  const disable = useMutation({ mutationFn: disableProvider, onSuccess: invalidate });

  const busyProviderId =
    (health.isPending ? health.variables : null) ??
    (makeDefault.isPending ? makeDefault.variables : null) ??
    (disable.isPending ? disable.variables : null);

  return (
    <>
      <PageHeader
        title="AI providers"
        description="Point LensAI at your own endpoint so your documents never reach the platform model."
        actions={<Button onClick={() => setRegistering(true)}>Register provider</Button>}
      />

      {routing.isError ? <ErrorNotice error={routing.error} /> : null}
      {health.isError ? <ErrorNotice error={health.error} title="Health check failed to run" /> : null}
      {makeDefault.isError ? <ErrorNotice error={makeDefault.error} title="Could not set the default" /> : null}
      {disable.isError ? <ErrorNotice error={disable.error} title="Could not disable the provider" /> : null}

      {routing.data ? <DataPolicyCard current={routing.data.data_policy} /> : null}

      {lastProbe ? (
        <Callout
          tone={lastProbe.health_ok ? "pass" : "fail"}
          title={
            lastProbe.health_ok
              ? `${lastProbe.provider.name} responded`
              : `${lastProbe.provider.name} is unreachable`
          }
        >
          {lastProbe.health_ok
            ? "The endpoint answered the probe. Its status is ACTIVE."
            : (lastProbe.health_error ?? "The endpoint did not answer the probe.")}
        </Callout>
      ) : null}

      <ProvidersTable
        providers={routing.data?.providers ?? []}
        defaultProviderId={routing.data?.default_provider_id ?? null}
        loading={routing.isPending}
        busyProviderId={busyProviderId}
        onHealthCheck={(id) => health.mutate(id)}
        onSetDefault={(id) => makeDefault.mutate(id)}
        onDisable={(id) => disable.mutate(id)}
      />

      <Callout tone="neutral" title="Disable is not delete">
        Completed verifications record which provider produced them. Removing the row would erase
        the answer to &ldquo;which model produced this verdict&rdquo; for every job it ever ran.
        Routing resolves job → template → client → account default → platform, and is explained in{" "}
        <Link href="/docs/byom" className="text-accent-bright underline underline-offset-2">
          the BYOM guide
        </Link>
        .
      </Callout>

      <RegisterProviderDialog
        open={registering}
        onClose={() => setRegistering(false)}
        onRegistered={(registered) => {
          setRegistering(false);
          setLastProbe(registered);
        }}
      />
    </>
  );
}
