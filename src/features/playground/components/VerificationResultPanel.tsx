"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Callout } from "@/components/ui/Callout";
import { listDeliveries } from "@/features/deliveries/api/deliveries";
import { cancelVerification, getVerification, getVerificationTrace } from "../api/playground";
import { summarise } from "../resultSummary";
import { IN_PROGRESS, readRun } from "../runPhases";
import { ResultDocumentPanel } from "./ResultDocumentPanel";
import { ResultPipelinePanel } from "./ResultPipelinePanel";
import { VerificationChecksTable } from "./VerificationChecksTable";
import { VerificationRunStage } from "./VerificationRunStage";
import { VerificationTracePanel } from "./VerificationTracePanel";
import { VerificationVerdictHero } from "./VerificationVerdictHero";

/**
 * The board, in the order the questions get asked.
 *
 *   1. the verdict, big, with the arithmetic behind it
 *   2. anything that changes how the verdict should be read
 *   3. the row-level verdicts, one per comparison
 *   4. how the pipeline ran, and where the time went
 *   5. the raw extraction and the plugin trace, folded away
 *
 * The panel used to put a three-column Document / Checks / Evidence grid in
 * slot 3, where the detail of a check only appeared once its row was clicked.
 * A verdict is read by scanning the disagreements, so the detail is now in the
 * table itself and the grid is gone.
 */

/** A delivery still moving. Worth another look in a few seconds. */
const DELIVERY_SETTLING = new Set(["PENDING", "IN_FLIGHT", "RETRYING"]);

export function VerificationResultPanel({
  apiKey,
  verificationId,
  wasReplay,
  onVerifyAnother,
}: {
  apiKey: string;
  verificationId: string;
  wasReplay: boolean | null;
  /** Clears the verification from the URL, which is what reopens the submit
   *  panels. The result stays reachable from the archive below. */
  onVerifyAnother: () => void;
}) {
  const result = useQuery({
    queryKey: ["verification", verificationId],
    queryFn: () => getVerification(apiKey, verificationId),
    // Poll only while the pipeline can still move. No websockets to rely on.
    refetchInterval: (query) =>
      query.state.data && IN_PROGRESS.has(query.state.data.job_status) ? 2000 : false,
  });

  const inProgress = result.data ? IN_PROGRESS.has(result.data.job_status) : false;

  /**
   * The trace, polled while the job runs.
   *
   * Same query key as the trace panel below, so the two share one cache entry
   * and one request — this observer just asks for it sooner and more often. The
   * worker writes a step row as each stage finishes, which is what lets the run
   * stage report where the job actually is instead of animating a guess.
   */
  const trace = useQuery({
    queryKey: ["verification-trace", verificationId],
    queryFn: () => getVerificationTrace(apiKey, verificationId),
    refetchInterval: inProgress ? 1000 : false,
  });

  /**
   * Did the client's endpoint actually get it?
   *
   * The panel has always promised the result "will also be POSTed to the
   * client's webhook endpoint if one is registered" and never said whether it
   * was. `reference_id` is the filter the deliveries endpoint offers, so this
   * asks by that and then picks this verification's own row. JWT-authenticated,
   * unlike everything else here — a different request, never a mixed one.
   */
  const deliveries = useQuery({
    queryKey: ["deliveries", result.data?.reference_id ?? "", "", 5],
    queryFn: () => listDeliveries({ reference_id: result.data?.reference_id, limit: 5 }),
    enabled: Boolean(result.data && !inProgress),
    refetchInterval: (query) =>
      query.state.data?.some((log) => DELIVERY_SETTLING.has(log.status)) ? 3000 : false,
  });

  const cancel = useMutation({
    mutationFn: () => cancelVerification(apiKey, verificationId),
    onSuccess: () => result.refetch(),
  });

  const data = result.data;
  const run = data ? readRun(data, trace.data) : null;
  const delivery = deliveries.data?.find((log) => log.verification_id === verificationId);
  // Derived, not stored: every count on the board is a reading of the response,
  // and it is read once here so the headline and the table cannot disagree.
  const summary = data ? summarise(data) : null;

  return (
    <section className="grid gap-3">
      {result.isError ? <ErrorNotice error={result.error} /> : null}
      {cancel.isError ? <ErrorNotice error={cancel.error} title="Could not cancel" /> : null}
      {result.isPending ? <p className="text-sm text-ink-muted">Fetching the verification…</p> : null}

      {run && inProgress ? (
        <VerificationRunStage
          state={run}
          cancelling={cancel.isPending}
          // Only QUEUED can be cancelled; once a worker holds the job there is
          // nothing to call off.
          onCancel={data?.job_status === "QUEUED" ? () => cancel.mutate() : undefined}
        />
      ) : null}

      {data && summary && !inProgress ? (
        <>
          {/* 1 — the answer. */}
          <VerificationVerdictHero
            data={data}
            summary={summary}
            totalMs={trace.data?.total_duration_ms ?? 0}
            delivery={delivery}
            refreshing={result.isFetching}
            onRefresh={() => result.refetch()}
            onVerifyAnother={onVerifyAnother}
          />

          {/*
            2 — the things that change how the verdict should be read. Directly
            under it, because a reader who stops at the verdict must not miss
            them, and nothing below this point has an entrance animation: the
            board is a screen to be read, and movement while you read it is
            noise.
          */}
          {data.job_status === "ERRORED" ? (
            <Callout tone="fail" title="The pipeline could not run">
              {data.failure_reason ?? "No failure reason was recorded."} This is an operational
              failure, not a compliance finding — there is deliberately no verdict.
            </Callout>
          ) : null}

          {data.verdict_reason ? (
            <Callout tone="neutral" title="Verdict reason">
              <code className="font-mono text-[13px]">{data.verdict_reason}</code>
            </Callout>
          ) : null}

          {wasReplay !== null ? (
            <Callout
              tone={wasReplay ? "warn" : "neutral"}
              title={wasReplay ? "200 — replay" : "202 — accepted"}
            >
              {wasReplay
                ? "This Idempotency-Key had already been used with the same body, so the original job was returned instead of a second one being created."
                : "A new job was queued. The result was also POSTed to the client's webhook endpoint if one is registered."}
            </Callout>
          ) : null}

          {/* 3 — every comparison, one row each. */}
          <VerificationChecksTable checks={data.checks} />

          {/* 4 — how it ran. */}
          <ResultPipelinePanel
            byStage={trace.data?.by_stage ?? []}
            steps={trace.data?.steps ?? []}
            totalMs={trace.data?.total_duration_ms ?? 0}
          />

          {/* 5 — the raw material, for when the table is not enough. Both fold
              away, because neither is part of reading the verdict. */}
          <ResultDocumentPanel extracted={data.extracted_fields} expected={data.expected_values} />

          <VerificationTracePanel apiKey={apiKey} verificationId={verificationId} />
        </>
      ) : null}
    </section>
  );
}
