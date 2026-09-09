import Link from "next/link";
import type { Metadata } from "next";
import { StatusPill } from "@/components/StatusPill";
import { VerdictLegend } from "@/components/VerdictLegend";
import { Callout } from "@/components/ui/Callout";
import { CodeBlock } from "@/components/ui/CodeBlock";

export const metadata: Metadata = {
  title: "Verdicts",
  description:
    "job_status answers whether the pipeline ran; verdict answers what it concluded. NOT_SPECIFIED is not a pass.",
};

export default function VerdictsPage() {
  return (
    <>
      <h1>Verdicts</h1>
      <p>
        Two fields, two questions, and they must never be merged into one column in your database.
      </p>

      <h2>job_status — did the pipeline run?</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {["QUEUED", "PROCESSING", "COMPLETED", "ERRORED", "CANCELLED"].map((status) => (
          <StatusPill key={status} value={status} />
        ))}
      </div>

      <table>
        <thead>
          <tr>
            <th>Value</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>QUEUED</code>
            </td>
            <td>Accepted, not yet claimed by a worker. Cancellable.</td>
          </tr>
          <tr>
            <td>
              <code>PROCESSING</code>
            </td>
            <td>A worker is running the pipeline.</td>
          </tr>
          <tr>
            <td>
              <code>COMPLETED</code>
            </td>
            <td>
              The pipeline ran to a conclusion. <strong>This is the only status that carries a
              verdict.</strong>
            </td>
          </tr>
          <tr>
            <td>
              <code>ERRORED</code>
            </td>
            <td>
              We could not run it. Read <code>failure_reason</code>; there is no verdict.
            </td>
          </tr>
          <tr>
            <td>
              <code>CANCELLED</code>
            </td>
            <td>Cancelled while queued.</td>
          </tr>
        </tbody>
      </table>

      <h2>verdict — what did it conclude?</h2>
      <VerdictLegend />

      <h2>Why they are separate</h2>
      <p>
        A single status field would force &ldquo;the document did not match&rdquo; and &ldquo;our
        OCR crashed&rdquo; into the same value, and those demand opposite actions on your side. One
        is a compliance finding you record; the other is an operational failure you retry.
      </p>

      <CodeBlock language="python">{`if event["event_type"] == "verification.failed":
    schedule_retry(reference_id)          # our problem
elif result["verdict"] == "NOT_SPECIFIED":
    route_to_human(reference_id)          # unreadable, not compliant
else:
    record_verdict(reference_id, result["verdict"])`}</CodeBlock>

      <h2>Per-field results</h2>
      <p>
        <code>checks[]</code> explains the verdict field by field. Each entry carries the expected
        value, the extracted value, a match status and the severity that decided whether it could
        change the verdict.
      </p>

      <table>
        <thead>
          <tr>
            <th>
              <code>match_status</code>
            </th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>MATCH</code>
            </td>
            <td>Expected and extracted agree under the check&rsquo;s rule.</td>
          </tr>
          <tr>
            <td>
              <code>MISMATCH</code>
            </td>
            <td>They disagree.</td>
          </tr>
          <tr>
            <td>
              <code>NOT_SPECIFIED</code>
            </td>
            <td>There was nothing to compare — see the check&rsquo;s absence rule.</td>
          </tr>
          <tr>
            <td>
              <code>NOT_VERIFIABLE</code>
            </td>
            <td>The check could not run at all.</td>
          </tr>
        </tbody>
      </table>

      <table>
        <thead>
          <tr>
            <th>
              <code>severity</code>
            </th>
            <th>Effect on the verdict</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>mandatory</code>
            </td>
            <td>A mismatch forces FAIL.</td>
          </tr>
          <tr>
            <td>
              <code>advisory</code>
            </td>
            <td>Recorded, verdict unaffected.</td>
          </tr>
          <tr>
            <td>
              <code>disabled</code>
            </td>
            <td>Present in the config, not executed.</td>
          </tr>
        </tbody>
      </table>

      <Callout tone="neutral" title="Absence rules differ per check, deliberately">
        Some checks report NOT_SPECIFIED only when <em>both</em> sides are empty; others when{" "}
        <em>either</em> is. That asymmetry is preserved from the source system these rules were
        ported from, because collapsing it would change verdicts on real data. Each
        template&rsquo;s <code>params.absence_rule</code> states which applies — see{" "}
        <Link href="/docs/templates">Templates</Link>.
      </Callout>

      <h2>Explaining a verdict</h2>
      <p>
        <code>GET /verifications/{"{id}"}/steps</code> returns every plugin that ran, what it
        produced, whether it passed and how long it took. Steps are written{" "}
        <em>before</em> the severity decision, so a job that stopped on a mandatory failure still
        has the row explaining why — otherwise the one job you need to debug is the only one with no
        trace.
      </p>

      <CodeBlock language="json">{`{
  "total_duration_ms": 2209,
  "by_stage": [
    {"stage": "extract", "steps": 1, "duration_ms": 1500},
    {"stage": "resolve", "steps": 1, "duration_ms": 700}
  ],
  "steps": [
    {
      "stage": "check",
      "plugin_name": "check.fuzzy_text",
      "status": "OK",
      "severity": "mandatory",
      "duration_ms": 5,
      "data": {"similarity": 97, "threshold": 95}
    }
  ]
}`}</CodeBlock>

      <p>
        <code>by_stage</code> is the same data sorted slowest-first, for when the question is
        &ldquo;why was this slow&rdquo; rather than &ldquo;why was this wrong&rdquo;. The{" "}
        <Link href="/app/playground">Playground</Link> renders both.
      </p>
    </>
  );
}
