import type { VerificationResult } from "@/lib/api/types";

/**
 * What a finished verification adds up to.
 *
 * One place, because the verdict hero and the row-level table are two views of
 * the same arithmetic and must never disagree about it — if the headline says
 * "6 of 7 matched" the table below has to contain exactly one row that did not.
 */

/**
 * The four outcomes a comparison can have, in the order they are worth reading:
 * agreement first, then the two kinds of disagreement, then the absence of a
 * comparison at all.
 *
 * These are status states, not a series, so they take the reserved status
 * palette — `pass` / `fail` / `warn` / `neutral` — and never a categorical hue.
 * Each one always ships with its word and its count beside it, so the meter is
 * never colour on its own.
 */
export const OUTCOMES = [
  { status: "MATCH", word: "matched", tone: "pass" },
  { status: "MISMATCH", word: "mismatched", tone: "fail" },
  { status: "NOT_VERIFIABLE", word: "not verifiable", tone: "warn" },
  { status: "NOT_SPECIFIED", word: "not specified", tone: "neutral" },
] as const;

export type OutcomeTone = (typeof OUTCOMES)[number]["tone"];

export interface Outcome {
  status: string;
  word: string;
  tone: OutcomeTone;
  count: number;
  /** Of the total checks, as a percentage. 0 when there are no checks. */
  share: number;
}

export interface ResultSummary {
  outcomes: Outcome[];
  total: number;
  matched: number;
  /** Checks that disagreed or could not be made — the ones a person reads. */
  unresolved: number;
  /** Fields the extractor actually returned a value for. */
  fieldsRead: number;
  /** Keys the tenant expected that never came back from extraction. */
  fieldsUnread: string[];
}

export function summarise(data: VerificationResult): ResultSummary {
  const total = data.checks.length;

  const outcomes = OUTCOMES.map((outcome) => {
    const count = data.checks.filter((check) => check.match_status === outcome.status).length;
    return {
      ...outcome,
      count,
      share: total === 0 ? 0 : (count / total) * 100,
    };
  });

  const matched = outcomes[0].count;
  const read = Object.keys(data.extracted_fields ?? {});

  return {
    outcomes,
    total,
    matched,
    unresolved: total - matched,
    fieldsRead: read.length,
    fieldsUnread: Object.keys(data.expected_values).filter((key) => !read.includes(key)),
  };
}

/**
 * The verdict in a sentence, because the word on its own does not say what to
 * do about it.
 *
 * NOT_SPECIFIED gets the longest one on purpose: it is the verdict most often
 * misread as a pass, and filing it as compliant is the most expensive mistake
 * this API allows.
 */
export function verdictSentence(data: VerificationResult, summary: ResultSummary): string {
  if (data.job_status === "ERRORED") {
    return "The pipeline could not run, so this job carries no verdict at all — an operational failure, not a compliance finding.";
  }
  if (data.job_status === "CANCELLED") {
    return "The job was cancelled before the pipeline reached a verdict.";
  }

  const { total, matched, unresolved } = summary;

  switch (data.verdict) {
    case "PASS":
      return total === 0
        ? "The pipeline completed and found nothing that contradicted the document."
        : `All ${total} comparison${total === 1 ? "" : "s"} agreed with the document. Nothing here needs a person.`;
    case "FAIL":
      return `${unresolved} of ${total} comparison${total === 1 ? "" : "s"} contradicted the document. At least one of them was mandatory, which is what decided this.`;
    case "PARTIAL":
      return `${matched} of ${total} comparisons agreed and the rest did not. Nothing mandatory failed, so the call is a person's to make.`;
    case "NOT_SPECIFIED":
      return "Nothing could be compared — the document was not legible enough to read the declared fields. This is not a pass: there is no evidence either way, so it has to go to a human.";
    default:
      return "This job finished without recording a verdict.";
  }
}
