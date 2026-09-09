import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/format";
import type { StageLatency, StepResult } from "@/lib/api/types";

/** The order the executor runs them in, so the flow reads left to right as the
 *  job actually happened rather than slowest first, which is how the API sorts. */
const ORDER = ["resolve", "extract", "integrity", "check", "verdict"];

const LABEL: Record<string, string> = {
  resolve: "Resolve",
  extract: "Extract",
  integrity: "Integrity",
  check: "Compare",
  verdict: "Verdict",
};

const CAPTION: Record<string, string> = {
  resolve: "locate and hash the bytes",
  extract: "read the declared fields",
  integrity: "check the document itself",
  check: "compare against expected",
  verdict: "weigh it up",
};

/**
 * How the job ran, as a flow, and where its time went.
 *
 * Two readings of the same rows, because they answer different questions. The
 * flow answers "what happened, in what order, and did anything break" — so it
 * is a sequence of equal nodes, since the reader is following a path and not
 * comparing sizes. The bar answers "where did the 1.2 seconds go" — a
 * proportion, which a row of figures reads badly and a single stacked bar reads
 * at a glance.
 *
 * Both are the stages that actually ran, with the millisecond counts the worker
 * recorded. A stage carrying a FAILED step is marked in both, because "which
 * stage broke" is the first thing anyone asks of a job that came back wrong.
 */
export function ResultPipelinePanel({
  byStage,
  steps,
  totalMs,
}: {
  byStage: StageLatency[];
  steps: StepResult[];
  totalMs: number;
}) {
  const stages = [...byStage]
    .sort((a, b) => ORDER.indexOf(a.stage) - ORDER.indexOf(b.stage))
    .map((stage) => ({
      ...stage,
      failed: steps.some((step) => step.stage === stage.stage && step.status === "FAILED"),
      share: totalMs === 0 ? 0 : (stage.duration_ms / totalMs) * 100,
    }));

  const totalSteps = stages.reduce((sum, stage) => sum + stage.steps, 0);

  return (
    <section className="panel p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[12.5px] font-medium text-ink">Pipeline execution</h2>
        <p className="font-mono text-[10.5px] text-ink-subtle tabular-nums">
          {formatDuration(totalMs)} · {totalSteps} step{totalSteps === 1 ? "" : "s"} ·{" "}
          {stages.length} stage{stages.length === 1 ? "" : "s"}
        </p>
      </header>

      {stages.length === 0 ? (
        <p className="py-6 text-center text-[12.5px] text-ink-muted">
          No steps were recorded for this job.
        </p>
      ) : (
        <>
          {/* The flow. A column on a phone — a stacked list still reads as a
              sequence, and five nodes plus four arrows on a 390px screen does
              not. */}
          <ol className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-0">
            {stages.map((stage, index) => (
              <li key={stage.stage} className="flex min-w-0 items-center sm:flex-1">
                <div
                  className={cn(
                    "min-w-0 flex-1 rounded-md border px-3 py-2.5",
                    stage.failed
                      ? "border-fail/45 bg-fail-soft"
                      : "border-line bg-surface-strong",
                  )}
                >
                  <p className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className={cn(
                        "size-[6px] shrink-0 rounded-full",
                        stage.failed ? "bg-fail" : "bg-pass",
                      )}
                    />
                    <span className="truncate font-mono text-[9.5px] tracking-[0.1em] text-ink-subtle uppercase">
                      {LABEL[stage.stage] ?? stage.stage}
                    </span>
                  </p>
                  <p className="mt-1.5 font-mono text-[15px] leading-none tabular-nums text-ink">
                    {formatDuration(stage.duration_ms)}
                  </p>
                  <p className="mt-1.5 truncate text-[11px] text-ink-subtle">
                    {stage.failed
                      ? `${stage.steps} step${stage.steps === 1 ? "" : "s"} · one failed`
                      : (CAPTION[stage.stage] ?? `${stage.steps} steps`)}
                  </p>
                </div>

                {index < stages.length - 1 ? (
                  <ChevronRight
                    aria-hidden
                    className="hidden size-4 shrink-0 text-ink-subtle sm:mx-1 sm:block"
                    strokeWidth={2}
                  />
                ) : null}
              </li>
            ))}
          </ol>

          {/*
            Where the time went. Every segment takes the ground's own chart
            fill — `--bar-image`, the same treatment the usage chart's bars ask
            for — rather than a colour per stage. Order is already unambiguous
            from position, so a colour per stage would be a second encoding of
            something the reader can already see, and it would mean this
            component naming a colour the ground is supposed to own. Only a
            stage that failed departs from it, and that is a status.

            Segments are separated by a 2px gap so two adjacent fills never
            read as one continuous block.
          */}
          <div className="mt-4">
            <p className="font-mono text-[9.5px] tracking-[0.1em] text-ink-subtle uppercase">
              Where the time went
            </p>
            <div
              className="mt-2 flex h-6 gap-[2px] overflow-hidden rounded-md"
              role="img"
              aria-label={stages
                .map(
                  (stage) =>
                    `${LABEL[stage.stage] ?? stage.stage} ${formatDuration(stage.duration_ms)}`,
                )
                .join(", ")}
            >
              {stages.map((stage) => (
                <span
                  key={stage.stage}
                  title={`${LABEL[stage.stage] ?? stage.stage} · ${formatDuration(stage.duration_ms)} · ${Math.round(stage.share)}%`}
                  className="h-full min-w-[3px] first:rounded-l-md last:rounded-r-md"
                  style={{
                    width: `${stage.share}%`,
                    backgroundImage: stage.failed ? "none" : "var(--bar-image)",
                    backgroundColor: stage.failed ? "var(--color-fail)" : undefined,
                  }}
                />
              ))}
            </div>

            {/* The names sit under the bar rather than inside it: a label
                inside has to be legible against the ground's chart fill on
                both grounds, and Porcelain's will not carry it. Same order as
                the segments, so the list reads as the key it is. */}
            <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
              {stages.map((stage) => (
                <li key={stage.stage} className="flex items-center gap-1.5 text-[11.5px]">
                  {stage.failed ? (
                    <span aria-hidden className="size-[7px] shrink-0 rounded-full bg-fail" />
                  ) : null}
                  <span className="text-ink-muted">{LABEL[stage.stage] ?? stage.stage}</span>
                  <span className="font-mono text-ink tabular-nums">
                    {formatDuration(stage.duration_ms)}
                  </span>
                  <span className="font-mono text-[10.5px] text-ink-subtle tabular-nums">
                    {Math.round(stage.share)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
