import { Callout } from "@/components/ui/Callout";
import { StatusPill } from "./StatusPill";

const VERDICTS = [
  { value: "PASS", meaning: "Every mandatory check matched." },
  { value: "FAIL", meaning: "A mandatory check mismatched, or a mandatory integrity check failed." },
  { value: "PARTIAL", meaning: "Some checks matched; the rest could not be read." },
  {
    value: "NOT_SPECIFIED",
    meaning: "Nothing could be verified — neither side had a value to compare.",
  },
];

/** The verdict vocabulary, stated identically wherever it appears. */
export function VerdictLegend() {
  return (
    <div className="grid gap-4">
      <dl className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
        {VERDICTS.map((verdict) => (
          <div key={verdict.value} className="bg-ground p-4">
            <dt>
              <StatusPill value={verdict.value} />
            </dt>
            <dd className="mt-2 text-sm text-ink-muted">{verdict.meaning}</dd>
          </div>
        ))}
      </dl>

      <Callout tone="warn" title="NOT_SPECIFIED is not a pass">
        It means the document could not be read, so there was nothing to compare. Route it to a
        human. Filing it as compliant is the single most costly way to misread this API.
      </Callout>

      <Callout tone="neutral" title="A verdict only exists once the pipeline ran">
        <code className="font-mono text-[13px]">job_status</code> answers &ldquo;did the pipeline
        run?&rdquo; and <code className="font-mono text-[13px]">verdict</code> answers &ldquo;what
        did it conclude?&rdquo;. An <strong>ERRORED</strong> job carries no verdict at all — read{" "}
        <code className="font-mono text-[13px]">failure_reason</code> instead. &ldquo;Our OCR
        crashed&rdquo; and &ldquo;this document is non-compliant&rdquo; must never land in the same
        column.
      </Callout>
    </div>
  );
}
