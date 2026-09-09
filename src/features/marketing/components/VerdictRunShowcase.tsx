"use client";

import { Check, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/cn";

/**
 * The hero's illustration: one verification, running.
 *
 * This is the same story the console tells while a job is in flight — the same
 * six stage names, the same sweeping document, the same ticks stamped one field
 * at a time, the same verdict landing at the end — so a visitor who signs up
 * recognises the screen they were sold.
 *
 * It is NOT the playground's run stage, and must not be confused with it. The
 * playground reads a real job and is driven by the step rows the worker has
 * written, never by a clock; there is deliberately no percentage bar there
 * because nothing reports one. Here there is no job at all, so the timeline
 * below is authored, and everything on the card is illustrative. That is honest
 * for a marketing surface and would be a lie in the console — which is why this
 * lives in `features/marketing` with its own glyph rather than importing the
 * console's.
 */

const CHECKS = [
  { field: "company_name", value: "Acme India Pvt. Ltd." },
  { field: "authority", value: "EPFO" },
  { field: "challan_amount", value: "45,200" },
  { field: "challan_date", value: "12-04-2026" },
] as const;

/** The console's own words for its pipeline stages, plus the settled state. */
const PHASES = [
  {
    word: "Queued",
    caption: "waiting for a worker to claim it",
    log: "POST /v1/verifications → 202",
    hue: "#6366f1",
  },
  {
    word: "Reading the documents",
    caption: "1 document · 2 pages",
    log: "resolve · sha256 9f2c1a7b…",
    hue: "#38bdf8",
  },
  {
    word: "Extracting the declared fields",
    caption: "text layer · 4 fields declared",
    log: "extract · 4 of 4 fields read",
    hue: "#22d3ee",
  },
  {
    word: "Checking the document itself",
    caption: "blank page · tampering · metadata",
    log: "integrity · no tampering signals",
    hue: "#a855f7",
  },
  {
    word: "Comparing against your expected values",
    caption: "field by field",
    log: "check",
    hue: "#fbbf24",
  },
  {
    word: "Resolving the verdict",
    caption: "4 of 4 matched",
    log: "verdict · PASS",
    hue: "#34d399",
  },
] as const;

/**
 * The authored run. One entry per beat, so the four ticks of the comparing
 * stage are four beats rather than one stage with a nested timer — every frame
 * of the sequence is then a single index, which is the only piece of state.
 */
const TIMELINE = [
  { phase: 0, marks: 0, ms: 950 },
  { phase: 1, marks: 0, ms: 1500 },
  { phase: 2, marks: 0, ms: 1700 },
  { phase: 3, marks: 0, ms: 1500 },
  { phase: 4, marks: 1, ms: 640 },
  { phase: 4, marks: 2, ms: 640 },
  { phase: 4, marks: 3, ms: 640 },
  { phase: 4, marks: 4, ms: 800 },
  { phase: 5, marks: 4, ms: 1300 },
  { phase: 6, marks: 4, ms: 4400 },
] as const;

const SETTLED = TIMELINE.length - 1;

export function VerdictRunShowcase() {
  const [beat, setBeat] = useState(0);
  const still = usePrefersReducedMotion();

  /**
   * The one effect here, and it is an effect for the right reason: a timer is
   * an external system, not state being copied from somewhere else.
   *
   * When the reader has asked for less motion no timer is ever scheduled, and
   * the frame read below is the settled one — so the card shows the finished
   * verification rather than freezing on the first beat of a run.
   */
  useEffect(() => {
    if (still) return;

    const timer = setTimeout(
      () => setBeat((current) => (current + 1) % TIMELINE.length),
      TIMELINE[beat].ms,
    );
    return () => clearTimeout(timer);
  }, [beat, still]);

  const { phase, marks } = TIMELINE[still ? SETTLED : beat];
  const settled = phase === 6;
  const stage = PHASES[Math.min(phase, PHASES.length - 1)];
  const hue = settled ? "#34d399" : stage.hue;
  const log = phase === 4 ? `check · ${CHECKS[marks - 1].field} · MATCH` : stage.log;

  return (
    <div
      className="relative"
      role="img"
      aria-label="An illustration of one verification running: the document is read, its fields are extracted and compared, and a PASS verdict is POSTed to your webhook."
    >
      {/* A blurred gradient behind an opaque card. Masked gradient borders look
          the same until the mask fails, and then they bleed across the card. */}
      <div
        aria-hidden
        className="absolute -inset-[3px] rounded-[1rem] bg-gradient-to-br from-viv-indigo via-viv-cyan to-viv-violet opacity-45 blur-[10px] transition-opacity duration-700"
        style={{ opacity: settled ? 0.5 : 0.32 }}
      />

      <div className="relative overflow-hidden rounded-xl border border-white/12 bg-deep-2 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.85)]">
        {/* The header never changes shape, only its status word — so the card
            does not resize as the job moves, and the eye stays on the body. */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="min-w-0">
            <p className="font-mono text-[12px] text-ink-muted">EVD233_19_883</p>
            <p className="mt-0.5 text-[13px] font-medium text-ink">challan · v1</p>
          </div>

          {settled ? (
            <span className="land inline-flex items-center gap-1.5 rounded-md border border-viv-emerald/30 bg-viv-emerald/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-viv-emerald uppercase">
              <Check aria-hidden className="size-3.5" strokeWidth={2.6} />
              Pass
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/12 bg-white/[0.05] px-2.5 py-1 font-mono text-[10.5px] tracking-[0.08em] text-ink-muted uppercase">
              <span
                aria-hidden
                className="size-1.5 animate-pulse rounded-full"
                style={{ backgroundColor: hue }}
              />
              {phase === 0 ? "Queued" : "Processing"}
            </span>
          )}
        </div>

        {/* One body, two contents, one height. Without the fixed minimum the
            hero would jump by ~40px every time the loop settles and restarts. */}
        <div className="relative grid min-h-[13.25rem] content-center">
          <span
            aria-hidden
            className="stage-halo pointer-events-none absolute top-1/2 left-1/2 h-[210px] w-[320px] -translate-x-1/2 -translate-y-1/2 blur-[14px] transition-opacity duration-700"
            style={{
              background: `radial-gradient(closest-side, ${hue}3d, transparent 70%)`,
              opacity: settled ? 0 : 1,
            }}
          />

          {settled ? (
            <ul className="relative divide-y divide-white/[0.07]">
              {CHECKS.map((check, index) => (
                <li
                  key={check.field}
                  className="rise flex items-center gap-3 px-4 py-2.5"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <Check
                    aria-hidden
                    className="size-3.5 shrink-0 text-viv-emerald"
                    strokeWidth={2.6}
                  />
                  <span className="w-[6.5rem] shrink-0 truncate font-mono text-[11.5px] text-ink-muted sm:w-[8.25rem] sm:text-[12px]">
                    {check.field}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{check.value}</span>
                  <span className="shrink-0 text-[11px] font-semibold tracking-wide text-viv-emerald uppercase">
                    Match
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="relative grid justify-items-center gap-3 px-4 py-5">
              <RunGlyph marks={marks} hue={hue} scanning={phase >= 1 && phase <= 3} receding={phase === 5} />

              <p
                key={phase}
                className="rise max-w-[17rem] text-center text-[14.5px] leading-snug font-medium tracking-[-0.015em] text-ink"
              >
                {stage.word}
              </p>
              <p className="-mt-1.5 text-center font-mono text-[10.5px] text-ink-subtle">
                {phase === 4 ? `${marks} of 4 fields compared` : stage.caption}
              </p>

              <div aria-hidden className="mt-0.5 flex gap-1.5">
                {PHASES.map((_, index) => (
                  <span
                    key={index}
                    className={cn(
                      "h-[2px] w-[18px] rounded-[2px] transition-colors duration-300",
                      index < phase ? "bg-white/40" : index > phase ? "bg-white/12" : null,
                    )}
                    style={index === phase ? { backgroundColor: hue } : undefined}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-white/[0.03] px-4 py-2.5 text-[12px] text-ink-muted">
          {settled ? (
            <>
              <span>4 of 4 mandatory checks matched</span>
              <span className="font-mono">1.24 s</span>
            </>
          ) : (
            // Not keyed and not animated: it changes on every beat, and a line
            // that slides in each time reads as noise rather than news.
            <span className="truncate font-mono text-[11px] text-ink-subtle">{log}</span>
          )}
        </div>
      </div>

      {/* The punchline, and the reason it waits: the result being POSTed is what
          happens *after* the verdict, so it arrives after the verdict does. */}
      <div
        className={cn(
          "relative mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-deep-2 px-3 py-2 transition-opacity duration-500",
          settled ? "rise opacity-100" : "opacity-0",
        )}
        style={settled ? { animationDelay: "320ms" } : undefined}
      >
        <ShieldCheck aria-hidden className="size-4 shrink-0 text-viv-cyan" strokeWidth={2} />
        <span className="text-[12px] font-medium text-ink">verification.completed</span>
        <span className="ml-auto font-mono text-[11px] text-viv-emerald">200 OK</span>
      </div>
    </div>
  );
}

/**
 * The document, stood in for — the console's glyph, re-cut for a dark ground.
 *
 * Not the console's component: that one paints with `var(--panel)` and the
 * console's semantic tokens, both of which resolve to paper now. The geometry
 * is deliberately identical so the two read as the same object.
 */
function RunGlyph({
  marks,
  hue,
  scanning,
  receding,
}: {
  marks: number;
  hue: string;
  scanning: boolean;
  receding: boolean;
}) {
  return (
    <div
      className={cn(
        "relative h-[124px] w-[100px] overflow-hidden rounded-[10px] border border-white/15",
        "bg-white/[0.05] shadow-[0_16px_40px_-16px_rgb(0_0_0/0.8)]",
        "transition-[transform,opacity,filter] duration-700",
        receding ? "scale-90 opacity-25 blur-[3px]" : "scale-100 opacity-100 blur-0",
      )}
    >
      {scanning ? (
        <span
          aria-hidden
          className="stage-sweep absolute inset-x-0 top-0 h-[24%]"
          style={{
            backgroundImage: `linear-gradient(180deg, transparent, ${hue}3d)`,
            borderBottom: `1px solid ${hue}`,
            boxShadow: `0 0 26px ${hue}66`,
          }}
        />
      ) : null}

      <div className="relative grid gap-2.5 px-3 py-3.5">
        {CHECKS.map((check, index) => (
          <div
            key={check.field}
            className="grid grid-cols-[minmax(0,1fr)_9px] items-center gap-1.5"
          >
            <span
              className={cn(
                "h-[5px] rounded-[3px] bg-white transition-opacity duration-300",
                index < marks ? "opacity-45" : "opacity-15",
              )}
            />
            {index < marks ? (
              <svg viewBox="0 0 12 12" aria-hidden className="stamp size-[9px] text-viv-emerald">
                <path
                  d="M2 6.4 L4.6 9 L10 3.2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <span />
            )}
          </div>
        ))}
      </div>

      <span className="absolute right-2 bottom-1.5 font-mono text-[9px] text-ink-subtle">
        {marks > 0 ? `${marks} checked` : "—"}
      </span>
    </div>
  );
}
