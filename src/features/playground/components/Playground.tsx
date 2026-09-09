"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Callout } from "@/components/ui/Callout";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClientSelect } from "@/features/clients/components/ClientSelect";
import { useUrlParams } from "@/hooks/useUrlParams";
import { isStaff } from "@/lib/auth/session";
import { usePlaygroundApiKey, useSession } from "@/lib/auth/useSession";
import type { DocumentUploaded } from "@/lib/api/types";
import { getVerification, whoami } from "../api/playground";
import { IN_PROGRESS } from "../runPhases";
import { PlaygroundKeyPanel } from "./PlaygroundKeyPanel";
import { SubmitVerificationForm } from "./SubmitVerificationForm";
import { UploadDocumentPanel } from "./UploadDocumentPanel";
import { VerificationListPanel } from "./VerificationListPanel";
import { VerificationResultPanel } from "./VerificationResultPanel";

export function Playground() {
  const { params, setParams } = useUrlParams();
  const session = useSession();
  const staff = isStaff(session);
  const apiKey = usePlaygroundApiKey();
  const clientId = params.get("client") ?? "";
  const verificationId = params.get("verification");

  const [uploads, setUploads] = useState<DocumentUploaded[]>([]);
  const [wasReplay, setWasReplay] = useState<boolean | null>(null);

  const identity = useQuery({
    queryKey: ["whoami", apiKey],
    queryFn: () => whoami(apiKey as string),
    enabled: apiKey !== null,
    retry: false,
  });

  /**
   * The job on screen, read from the same cache entry the result panel polls.
   *
   * Same query key, and no `refetchInterval` of its own, so this is a read and
   * not a second request. It is here because the decision it drives is about
   * the *page* — while a job is running the page is the run stage and nothing
   * else — and that is not the result panel's business.
   */
  const active = useQuery({
    queryKey: ["verification", verificationId],
    queryFn: () => getVerification(apiKey as string, verificationId as string),
    enabled: apiKey !== null && verificationId !== null,
  });

  /**
   * Submitting closes the setup panels; the CTA on a finished result reopens
   * them. Derived from the URL rather than held in state, so a link to a
   * verification opens in the same read-only shape it would after submitting.
   */
  const setupOpen = verificationId === null;

  /**
   * Whether to clear the page down to the run stage.
   *
   * The status is unknown for the render or two before the first response, and
   * which way to guess depends on how we got here — `wasReplay` is only
   * non-null when this verification came from a submission just made, which is
   * a job that is almost certainly still running. Opening an old one from the
   * archive guesses the other way. Guessing wrong either way makes the archive
   * flash in or out for a moment, which is the whole reason this is not just
   * `?? true`.
   */
  const running =
    verificationId !== null &&
    (active.data ? IN_PROGRESS.has(active.data.job_status) : wasReplay !== null);

  return (
    <>
      <PageHeader
        title="Playground"
        description="Run the verification API end to end from the browser: upload, submit, poll, and read the trace behind a verdict."
      />

      {setupOpen || apiKey === null ? (
        <PlaygroundKeyPanel
          apiKey={apiKey}
          identity={identity.data}
          error={identity.error}
          checking={identity.isFetching}
          onRetest={() => identity.refetch()}
          isStaff={staff}
        />
      ) : null}

      {apiKey === null ? (
        <EmptyState
          title={staff ? "Generate a session to begin" : "Paste an API key to begin"}
          description={
            staff ? (
              "One click above mints an already-approved key scoped to the internal admin playground client — no queue, no separate tenant key to manage."
            ) : (
              <>
                There is no portal route that lists or submits verifications — that surface is{" "}
                <code className="font-mono text-[12px]">x-api-key</code> only. Create a key on{" "}
                <Link href="/app/keys" className="text-accent-bright underline underline-offset-2">
                  API keys
                </Link>{" "}
                and have an administrator approve it.
              </>
            )
          }
        />
      ) : null}

      {apiKey !== null && identity.isError ? (
        <Callout tone="warn" title="The rest of the playground is locked">
          Until this key authenticates, no upload or submission can succeed. Fix the key above, then
          test again.
        </Callout>
      ) : null}

      {apiKey !== null && identity.data ? (
        <>
          {/* Setup, only while there is nothing to look at. Once a document has
              been detailed and sent, these close — the job is the screen. */}
          {setupOpen ? (
            <>
              <div className="max-w-sm">
                <ClientSelect
                  value={clientId}
                  required
                  hint="Uploads and verifications both carry a client_id, and a document uploaded for one client cannot be submitted under another."
                  onChange={(value) => setParams({ client: value || null })}
                />
              </div>

              {clientId === "" ? (
                <EmptyState
                  title="Select a client"
                  description="Every upload and every verification belongs to one of your clients."
                />
              ) : (
                <>
                  <UploadDocumentPanel
                    apiKey={apiKey}
                    clientId={clientId}
                    uploads={uploads}
                    onUploaded={(document) => setUploads((current) => [...current, document])}
                  />

                  <SubmitVerificationForm
                    apiKey={apiKey}
                    clientId={clientId}
                    uploads={uploads}
                    onSubmitted={(id, replay) => {
                      setWasReplay(replay);
                      setParams({ verification: id });
                    }}
                  />
                </>
              )}
            </>
          ) : null}

          {verificationId ? (
            <VerificationResultPanel
              apiKey={apiKey}
              verificationId={verificationId}
              wasReplay={wasReplay}
              onVerifyAnother={() => setParams({ verification: null })}
            />
          ) : null}

          {/* The archive. Folded away, and gone entirely while a job runs —
              during a run the page is the stage and nothing else. */}
          {running ? null : (
            <VerificationListPanel
              apiKey={apiKey}
              onOpen={(id) => {
                setWasReplay(null);
                setParams({ verification: id });
              }}
            />
          )}
        </>
      ) : null}
    </>
  );
}
