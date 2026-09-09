import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/format";
import { RUN_PHASE_COUNT, type RunState } from "../runPhases";
import { RunGlyph } from "./RunGlyph";

/** r=55 on a 120 viewBox, so 2πr. The ring's whole length. */
const RING = 345.6;

/**
 * What the console shows while a job is still running.
 *
 * Every word, count and mark on it comes from `readRun` — the job's own status
 * and the step rows the worker has written so far. The only motion not tied to
 * a fact is the sweep and the halo, which loop to say "still working" and are
 * careful not to imply a position within a stage, because nothing reports one.
 *
 * It replaces a line of text that used to read "Polling every 2 seconds while
 * the job is PROCESSING", which was true and told the reader nothing about
 * their document.
 */
export function VerificationRunStage({
  state,
  onCancel,
  cancelling,
}: {
  state: RunState;
  /** Only while the job is still QUEUED — once a worker has it, there is
   *  nothing to cancel. The banner that used to carry this is hidden during a
   *  run, and the design puts a single quiet text button in exactly this spot. */
  onCancel?: () => void;
  cancelling: boolean;
}) {
  const { phase, word, hue, caption, log, failing, marks, matched } = state;
  const scanning = phase >= 1 && phase <= 3;
  const resolving = phase >= 5;

  return (
    <section
      aria-label="Verification progress"
      className="panel relative grid justify-items-center overflow-hidden px-5 pt-14 pb-11"
    >
      <span
        aria-hidden
        className="stage-halo pointer-events-none absolute top-[34%] left-1/2 h-[300px] w-[460px] -translate-x-1/2 -translate-y-1/2 blur-[16px]"
        style={{ background: `radial-gradient(closest-side, ${hue}2e, transparent 70%)` }}
      />

      <div className="relative grid w-full max-w-[620px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 sm:gap-8">
        {/* Left: what was actually received. Each row mounts when the step that
            reported it lands, so the column fills in as the pipeline moves. */}
        <div className="grid justify-items-end gap-1.5 text-right">
          <Fact value={state.documents}>
            {state.documents} document{state.documents === 1 ? "" : "s"}
          </Fact>
          <Fact value={state.pages}>
            {state.pages} page{state.pages === 1 ? "" : "s"}
          </Fact>
          <Fact value={state.sha256}>
            sha256 <span className="text-ink">{state.sha256}</span>
          </Fact>
          <Fact value={state.strategy}>{state.strategy}</Fact>
        </div>

        <div className="relative grid place-items-center">
          <RunGlyph marks={marks} scanning={scanning} receding={resolving} hue={hue} />

          {/* The ring is the one determinate figure on the stage: how many of
              the fields compared so far agreed. It only exists once there is
              something to divide by. */}
          {resolving && marks.length > 0 ? (
            <svg
              viewBox="0 0 120 120"
              aria-hidden
              className="absolute size-[146px] -rotate-90"
            >
              <circle cx="60" cy="60" r="55" fill="none" stroke="var(--color-line)" strokeWidth="2" />
              <circle
                cx="60"
                cy="60"
                r="55"
                fill="none"
                stroke={hue}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={RING}
                strokeDashoffset={RING * (1 - matched / marks.length)}
                className="transition-[stroke-dashoffset] duration-700 ease-out-soft"
              />
            </svg>
          ) : null}
        </div>

        {/* Right: counts, each one a tally of real step rows. */}
        <div className="grid gap-1.5">
          <Fact value={marks.length || null}>
            <span className="text-ink">{marks.length}</span> compared
          </Fact>
          <Fact value={marks.length || null}>
            <span className="text-ink">{matched}</span> matched
          </Fact>
          <Fact value={state.stepCount || null}>
            <span className="text-ink">{state.stepCount}</span> steps
          </Fact>
          <Fact value={state.durationMs || null}>
            <span className="text-ink">{formatDuration(state.durationMs)}</span> in the pipeline
          </Fact>
        </div>
      </div>

      {/* The phase sentence, and the only part of the stage a screen reader is
          told about as it changes. The word is keyed on the phase so each new
          stage re-runs the entrance rather than the text swapping in place —
          which is also what makes the region announce. */}
      <div aria-live="polite" className="grid justify-items-center">
        <p
          key={phase}
          className="rise mt-7 text-center text-[21px] leading-tight font-medium tracking-[-0.03em] text-ink"
        >
          {word}
        </p>

        <p
          className={cn(
            "mt-1.5 text-center font-mono text-[11.5px]",
            failing ? "text-fail" : "text-ink-subtle",
          )}
        >
          {failing ? "a step failed — the job may still be retried" : caption}
        </p>
      </div>

      {/* The newest step. Not keyed and not animated: it changes on every poll,
          and a line that slides in each time reads as noise rather than news. */}
      <p className="mt-1 max-w-full truncate font-mono text-[10.5px] text-ink-subtle">
        {log ?? " "}
      </p>

      <div className="mt-5 flex gap-1.5" aria-hidden>
        {Array.from({ length: RUN_PHASE_COUNT }, (_, index) => (
          <span
            key={index}
            aria-hidden
            className={cn(
              "h-[2px] w-[22px] rounded-[2px] transition-colors duration-300",
              index < phase ? "bg-ink-subtle" : index > phase ? "bg-line-strong" : null,
            )}
            style={index === phase ? { backgroundColor: hue } : undefined}
          />
        ))}
      </div>

      {onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          disabled={cancelling}
          className="mt-5 font-mono text-[10.5px] tracking-[0.12em] text-ink-subtle uppercase transition-colors hover:text-ink disabled:opacity-50"
        >
          {cancelling ? "Cancelling…" : "Cancel job"}
        </button>
      ) : null}
    </section>
  );
}

/** One mono micro-fact. Renders nothing until its value exists, so the entrance
 *  fires when the step that reported it arrived and not before. */
function Fact({ value, children }: { value: unknown; children: ReactNode }) {
  if (value === null || value === undefined) return null;
  return <span className="rise font-mono text-[10.5px] text-ink-subtle">{children}</span>;
}
