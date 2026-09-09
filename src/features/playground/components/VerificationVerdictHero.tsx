import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { CopyValue } from "@/components/ui/CopyValue";
import { Pill, type Tone } from "@/components/ui/Pill";
import { Timestamp } from "@/components/ui/Timestamp";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/format";
import type { DeliverySummary, VerificationResult } from "@/lib/api/types";
import { verdictSentence, type Outcome, type OutcomeTone, type ResultSummary } from "../resultSummary";

/**
 * The colour of the headline word, whichever word it is.
 *
 * Keyed on both enums on purpose: the headline shows the verdict once there is
 * one and the job_status until then, the two vocabularies do not overlap, and a
 * single table colours either without the caller knowing which it holds.
 */
const HEADLINE_TEXT: Record<string, string> = {
  PASS: "text-pass",
  FAIL: "text-fail",
  PARTIAL: "text-warn",
  NOT_SPECIFIED: "text-warn",
  ERRORED: "text-fail",
  CANCELLED: "text-ink-muted",
};

/** The two verdicts that mean a person still has to look at this. */
const NEEDS_A_HUMAN = new Set(["PARTIAL", "NOT_SPECIFIED"]);

const DELIVERY_TONE: Record<string, Tone> = {
  SUCCESS: "pass",
  FAILED: "fail",
  PENDING: "neutral",
  IN_FLIGHT: "warn",
  RETRYING: "warn",
};

const FILL: Record<OutcomeTone, string> = {
  pass: "bg-pass",
  fail: "bg-fail",
  warn: "bg-warn",
  neutral: "bg-neutral",
};

const DOT_TEXT: Record<OutcomeTone, string> = {
  pass: "text-pass",
  fail: "text-fail",
  warn: "text-warn",
  neutral: "text-ink-subtle",
};

/**
 * The answer, at the top of the board, big.
 *
 * Everything on it is one of three things: the verdict itself, the arithmetic
 * behind it, or the identity of the job it belongs to. Nothing else — the
 * per-field detail is the table below, and the timings are the pipeline below
 * that. A reader who only looks at this panel should still leave knowing what
 * the answer was and whether it needs them.
 */
export function VerificationVerdictHero({
  data,
  summary,
  totalMs,
  delivery,
  refreshing,
  onRefresh,
  onVerifyAnother,
}: {
  data: VerificationResult;
  summary: ResultSummary;
  /** Real pipeline time from the trace, or 0 before it lands. */
  totalMs: number;
  delivery: DeliverySummary | undefined;
  refreshing: boolean;
  onRefresh: () => void;
  onVerifyAnother: () => void;
}) {
  const completed = data.job_status === "COMPLETED";
  const headline = completed ? (data.verdict ?? "NOT_SPECIFIED") : data.job_status;

  return (
    <section
      className={cn(
        // The verdict lands rather than sliding in: it is the answer, so it
        // settles in place. It fires once, on mount, which is the render where
        // the job stopped running. Nothing below this panel has an entrance.
        "land panel overflow-hidden",
        NEEDS_A_HUMAN.has(data.verdict ?? "") && "panel-warn",
      )}
    >
      <div className="grid gap-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-[0.14em] text-ink-subtle uppercase">
              {completed ? "Verdict" : "Job status"}
            </p>
            <p
              className={cn(
                "mt-2 text-[clamp(2.25rem,6vw,3.25rem)] leading-[0.95] font-medium tracking-[-0.04em]",
                HEADLINE_TEXT[headline] ?? "text-ink",
              )}
            >
              {headline.replace(/_/g, " ")}
            </p>
            <p className="mt-3 max-w-[62ch] text-[13.5px] leading-relaxed text-ink-muted">
              {verdictSentence(data, summary)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {delivery ? (
              <Pill tone={DELIVERY_TONE[delivery.status] ?? "neutral"}>
                signed POST · {delivery.http_status_code ?? delivery.status}
              </Pill>
            ) : null}
            <Button variant="secondary" size="sm" disabled={refreshing} onClick={onRefresh}>
              {refreshing ? "Refreshing…" : "Refresh"}
            </Button>
            {/* The way back to the submit panels, which closed when this job was
                sent. Primary, because on a finished job it is the next thing
                anyone wants. */}
            <Button size="sm" onClick={onVerifyAnother}>
              Verify another document
            </Button>
          </div>
        </div>

        {summary.total > 0 ? <OutcomeMeter outcomes={summary.outcomes} total={summary.total} /> : null}
      </div>

      {/* The arithmetic, on its own band. A figure without the comparison that
          gives it meaning is a number nobody can act on, so each one carries
          its denominator or its unit. */}
      <div className="grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
        <Figure label="Checks matched">
          {summary.total > 0 ? (
            <>
              {summary.matched}
              <span className="text-ink-subtle"> / {summary.total}</span>
            </>
          ) : (
            "—"
          )}
        </Figure>
        <Figure label="Confidence">{data.confidence_score ?? "—"}</Figure>
        <Figure label="Fields read">
          {summary.fieldsRead}
          {summary.fieldsUnread.length > 0 ? (
            <span className="text-warn"> +{summary.fieldsUnread.length} unread</span>
          ) : null}
        </Figure>
        <Figure label="Pipeline time">{totalMs > 0 ? formatDuration(totalMs) : "—"}</Figure>
        <Figure label="Attempt">{data.attempt_count}</Figure>
      </div>

      {/* Which job this is. Last, and quiet: it matters when you need to quote
          it to someone, and never while you are reading the answer. */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-line px-5 py-2.5 font-mono text-[10.5px] text-ink-subtle sm:px-6">
        <CopyValue value={data.verification_id} truncate />
        <span aria-hidden>·</span>
        <span>
          {data.nature.name} v{data.nature.version}
        </span>
        <span aria-hidden>·</span>
        <span className="truncate">ref {data.reference_id}</span>
        {data.extraction_strategy ? (
          <>
            <span aria-hidden>·</span>
            <span>{data.extraction_strategy}</span>
          </>
        ) : null}
        {data.processing_completed_at ? (
          <>
            <span aria-hidden>·</span>
            <Timestamp value={data.processing_completed_at} />
          </>
        ) : null}
      </div>
    </section>
  );
}

/**
 * How the comparisons split, as one bar.
 *
 * A stacked bar rather than four numbers, because the question it answers is a
 * proportion — "how much of this document agreed" — and a proportion is the one
 * thing a row of figures reads badly. Segments are separated by a 2px gap in
 * the surface colour so two adjacent fills never look like one, and every
 * segment is named with its count underneath, so the bar is a second reading of
 * the legend rather than the only place the information lives.
 */
function OutcomeMeter({ outcomes, total }: { outcomes: Outcome[]; total: number }) {
  const present = outcomes.filter((outcome) => outcome.count > 0);

  return (
    <div className="grid gap-2.5">
      <div
        className="flex h-2 gap-[2px] overflow-hidden rounded-full"
        role="img"
        aria-label={present
          .map((outcome) => `${outcome.count} ${outcome.word}`)
          .join(", ")}
      >
        {present.map((outcome) => (
          <span
            key={outcome.status}
            title={`${outcome.count} ${outcome.word}`}
            className={cn("h-full first:rounded-l-full last:rounded-r-full", FILL[outcome.tone])}
            style={{ width: `${outcome.share}%` }}
          />
        ))}
      </div>

      {/* Zero counts stay in the legend, dimmed. "0 mismatched" is the single
          most reassuring thing on a PASS, and removing it would take that with
          it — the reader would not know the category had been considered. */}
      <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
        {outcomes.map((outcome) => (
          <li
            key={outcome.status}
            className={cn(
              "flex items-center gap-1.5 text-[12px]",
              outcome.count === 0 && "opacity-45",
            )}
          >
            <span
              aria-hidden
              className={cn("size-[7px] shrink-0 rounded-full", FILL[outcome.tone])}
            />
            <span className={cn("font-mono tabular-nums", DOT_TEXT[outcome.tone])}>
              {outcome.count}
            </span>
            <span className="text-ink-muted">{outcome.word}</span>
          </li>
        ))}
      </ul>

      <p className="sr-only">{total} comparisons in total.</p>
    </div>
  );
}

/**
 * One figure on the band. Mono micro-label over the number, as everywhere else
 * in the console — the figure is the thing being read, not its label.
 *
 * The size and the face both come from `.figure` rather than utilities,
 * because both belong to the ground — and `font-mono` in particular must stay
 * out of that class list, since it would win and restore the slashed zero.
 * Deliberately not `.figure-gradient`:
 * every figure here carries a second ink beside the number — a denominator, or
 * an amber count of fields that were never read — and the gradient sets
 * `-webkit-text-fill-color`, which would paint straight over it.
 */
function Figure({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bg-ground px-5 py-3.5 sm:px-6">
      <p className="font-mono text-[9.5px] tracking-[0.1em] text-ink-subtle uppercase">{label}</p>
      <p className="figure mt-2 leading-none tracking-[-0.02em] text-ink">
        {children}
      </p>
    </div>
  );
}
