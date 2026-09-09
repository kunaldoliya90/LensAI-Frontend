"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { CopyValue } from "@/components/ui/CopyValue";
import { Input } from "@/components/ui/Input";
import { issuePlaygroundSession } from "@/features/admin/api/admin";
import { playgroundKeyStore } from "@/lib/auth/session";
import type { WhoAmIResponse } from "@/lib/api/types";

export function PlaygroundKeyPanel({
  apiKey,
  identity,
  error,
  checking,
  onRetest,
  isStaff,
}: {
  apiKey: string | null;
  identity: WhoAmIResponse | undefined;
  error: unknown;
  checking: boolean;
  onRetest: () => void;
  /** Staff never hand-hold a key through the approval queue — one click mints
   * an already-approved key scoped to the internal admin playground client. */
  isStaff: boolean;
}) {
  const [draft, setDraft] = useState("");
  const issue = useMutation({
    mutationFn: issuePlaygroundSession,
    onSuccess: (result) => playgroundKeyStore.set(result.api_key),
  });

  return (
    <section className="panel p-4">
      <h2 className="text-[12.5px] font-medium">API key</h2>
      <p className="mt-1 max-w-3xl text-[13px] text-ink-muted">
        The playground is the only part of the console that calls the verification API, and that API
        accepts <code className="font-mono text-[12px]">x-api-key</code> only. The key is kept in
        this tab&rsquo;s <code className="font-mono text-[12px]">sessionStorage</code> under{" "}
        <code className="font-mono text-[12px]">lensai.playgroundApiKey</code>, is never written to
        a LensAI database, and is cleared when you log out or close the tab.
      </p>

      <div className="mt-4 grid gap-3">
        {apiKey ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm">
              Key stored:{" "}
              <code className="font-mono text-[13px]">
                {apiKey.slice(0, 8)}…{apiKey.slice(-4)}
              </code>
            </span>
            <Button variant="secondary" size="sm" disabled={checking} onClick={onRetest}>
              {checking ? "Checking…" : "Test whoami"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => playgroundKeyStore.clear()}>
              Forget key
            </Button>
          </div>
        ) : isStaff ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={issue.isPending} onClick={() => issue.mutate()}>
              {issue.isPending ? "Generating…" : "Generate a playground session"}
            </Button>
            <span className="text-[13px] text-ink-muted">
              Mints a key scoped to the internal admin playground client, already approved — no
              queue to wait behind.
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-64 flex-1">
              <Input
                label="Paste an approved API key"
                type="password"
                autoComplete="off"
                mono
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
            </div>
            <Button
              disabled={draft.trim() === ""}
              onClick={() => {
                playgroundKeyStore.set(draft.trim());
                setDraft("");
              }}
            >
              Store key
            </Button>
          </div>
        )}

        {issue.isError ? (
          <ErrorNotice error={issue.error} title="Could not generate a session key" />
        ) : null}
        {error ? <ErrorNotice error={error} title="The key did not authenticate" /> : null}

        {identity ? (
          <Callout tone="pass" title="Key authenticates">
            <dl className="mt-1 grid gap-2 text-[13px] sm:grid-cols-3">
              <div>
                <dt className="text-ink-muted">Tenant</dt>
                <dd className="mt-0.5">
                  <CopyValue value={identity.tenant_id} truncate />
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Environment</dt>
                <dd className="mt-0.5">
                  <StatusPill value={identity.environment} />
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Rate limit tier</dt>
                <dd className="mt-0.5 font-mono">{identity.rate_limit_tier}</dd>
              </div>
            </dl>
          </Callout>
        ) : null}
      </div>
    </section>
  );
}
