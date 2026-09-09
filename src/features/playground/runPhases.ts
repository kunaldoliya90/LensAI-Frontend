import type { StepResult, VerificationResult, VerificationTrace } from "@/lib/api/types";

/**
 * Reading a running job's real position in the pipeline.
 *
 * The console has no progress figure to render and cannot invent one: the API
 * reports `job_status` and, separately, the step rows the worker has written so
 * far. What it does report is enough, because the worker persists each step the
 * moment its stage finishes (`PipelineExecutor._record` writes through a
 * per-step session), so the trace of a job still running is the list of stages
 * that are already done. The stage after the last one present is the stage
 * currently running — that is the whole inference in this file.
 *
 * Everything below is derived from those two responses. Nothing is timed, and
 * no count is estimated: a number appears here only once a step row carries it.
 */

/** The two statuses a job can still move out of on its own. */
export const IN_PROGRESS = new Set(["QUEUED", "PROCESSING"]);

/** The order `PipelineExecutor.execute` runs them in. */
const STAGES = ["resolve", "extract", "integrity", "check", "verdict"] as const;

/** The word for each phase. Index 0 is "not started"; 1–5 line up with STAGES. */
const WORDS = [
  "Queued",
  "Reading the documents",
  "Extracting the declared fields",
  "Checking the document itself",
  "Comparing against your expected values",
  "Resolving the verdict",
] as const;

export const RUN_PHASE_COUNT = WORDS.length;

/**
 * The accent each phase is tinted with — the halo, the current dot, the sweep.
 *
 * Literal colours rather than tokens because they are a six-step progression
 * through the spectrum, not six semantic states. Each is a mid-tone: a hue here
 * is a 2px ring, a 2px dot and a hairline over the sweep, and it has to hold on
 * blue glass and on paper, so it can be neither pastel nor near-black. The last
 * two deliberately land on the warn and pass hues: by then the phase names are
 * about a verdict, and the colour should start agreeing with it.
 */
const HUES = ["#6d78f5", "#22b8d4", "#a855f7", "#e0a020", "#e0a020", "#1fb37f"] as const;

export interface RunMark {
  field: string;
  matchStatus: string;
}

export interface RunState {
  /** 0 while queued, then the index in STAGES of the stage now running, + 1. */
  phase: number;
  word: string;
  hue: string;
  /** Mono caption under the word, from real step data where a step carries it. */
  caption: string;
  /** The newest step, as one line — the closest thing to a live log. */
  log: string | null;
  /** A step wrote FAILED. The job may still be retried, so this is not terminal. */
  failing: boolean;
  /** Per-field outcomes in the order the worker compared them. */
  marks: RunMark[];
  matched: number;
  /** Facts about what was actually received, from the resolve step. */
  documents: number | null;
  pages: number | null;
  sha256: string | null;
  /** The extractor's own record of how it read the document. */
  strategy: string | null;
  model: string | null;
  /** Real pipeline time so far, summed over the steps written. */
  durationMs: number;
  stepCount: number;
}

function readNumber(data: Record<string, unknown> | null, key: string): number | null {
  const value = data?.[key];
  return typeof value === "number" ? value : null;
}

function readString(data: Record<string, unknown> | null, key: string): string | null {
  const value = data?.[key];
  return typeof value === "string" ? value : null;
}

/** `resolve` reports one truncated digest per document; the first is enough to
 *  recognise a re-submission of the same bytes by eye. */
function readFirstDigest(data: Record<string, unknown> | null): string | null {
  const value = data?.sha256;
  if (!Array.isArray(value)) return null;
  const first = value[0];
  return typeof first === "string" ? first : null;
}

function lastStepOf(steps: StepResult[], stage: string): StepResult | undefined {
  return steps.reduce<StepResult | undefined>(
    (found, step) => (step.stage === stage ? step : found),
    undefined,
  );
}

/** One line naming the step and the one fact from it worth reading at a glance. */
function describe(step: StepResult): string {
  if (step.error) return `${step.plugin_name} · ${step.error}`;

  const field = readString(step.data, "field");
  const matchStatus = readString(step.data, "match_status");
  if (field && matchStatus) return `${step.plugin_name} · ${field} · ${matchStatus}`;

  const verdict = readString(step.data, "verdict");
  if (verdict) return `${step.plugin_name} · ${verdict}`;

  const pages = readNumber(step.data, "pages");
  if (pages !== null) return `${step.plugin_name} · ${pages} page${pages === 1 ? "" : "s"}`;

  return `${step.plugin_name} · ${step.status}`;
}

function captionFor(phase: number, state: Omit<RunState, "caption" | "word" | "hue">): string {
  const { documents, pages, strategy, model, marks, matched } = state;

  if (phase === 0) return "waiting for a worker to claim it";
  if (phase === 1) return "locating and hashing the bytes";

  const received =
    documents !== null && pages !== null
      ? `${documents} document${documents === 1 ? "" : "s"} · ${pages} page${pages === 1 ? "" : "s"}`
      : null;

  if (phase === 2) return received ?? "reading the document";
  if (phase === 3) return [strategy, model].filter(Boolean).join(" · ") || (received ?? "extracted");
  if (phase === 4) {
    return marks.length > 0
      ? `${marks.length} field${marks.length === 1 ? "" : "s"} compared`
      : "comparing field by field";
  }
  return marks.length > 0 ? `${matched} of ${marks.length} matched` : "weighing the evidence";
}

/**
 * The stage the job is in right now, plus everything the steps so far reported.
 *
 * `trace` is undefined until its first fetch lands, which is the normal case
 * for a job that was submitted a second ago — the result is phase 0, which is
 * exactly right.
 */
export function readRun(
  result: VerificationResult,
  trace: VerificationTrace | undefined,
): RunState {
  const steps = trace?.steps ?? [];

  // A step row means its stage finished, so the running stage is the next one.
  // Highest-index-seen rather than a count: extraction and integrity can
  // interleave, and a nature with no integrity spec would leave a gap.
  const lastDone = STAGES.reduce(
    (highest, stage, index) => (steps.some((step) => step.stage === stage) ? index : highest),
    -1,
  );
  const phase =
    result.job_status === "QUEUED" ? 0 : Math.min(lastDone + 2, STAGES.length);

  const resolveStep = lastStepOf(steps, "resolve");
  const extractStep = lastStepOf(steps, "extract");
  const checkSteps = steps.filter((step) => step.stage === "check");

  const marks: RunMark[] = checkSteps.flatMap((step) => {
    const field = readString(step.data, "field");
    const matchStatus = readString(step.data, "match_status");
    return field && matchStatus ? [{ field, matchStatus }] : [];
  });

  const facts = {
    phase,
    log: steps.length > 0 ? describe(steps[steps.length - 1]) : null,
    failing: steps.some((step) => step.status === "FAILED"),
    marks,
    matched: marks.filter((mark) => mark.matchStatus === "MATCH").length,
    documents: readNumber(resolveStep?.data ?? null, "documents"),
    pages: readNumber(resolveStep?.data ?? null, "pages") ?? readNumber(extractStep?.data ?? null, "pages"),
    sha256: readFirstDigest(resolveStep?.data ?? null),
    strategy: readString(extractStep?.data ?? null, "strategy") ?? result.extraction_strategy,
    model: readString(extractStep?.data ?? null, "model"),
    durationMs: steps.reduce((total, step) => total + step.duration_ms, 0),
    stepCount: steps.length,
  };

  return {
    ...facts,
    word: WORDS[phase],
    hue: HUES[phase],
    caption: captionFor(phase, facts),
  };
}
