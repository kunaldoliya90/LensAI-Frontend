import Link from "next/link";
import type { Metadata } from "next";
import { Callout } from "@/components/ui/Callout";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { API_ROOT } from "@/lib/api/config";

export const metadata: Metadata = {
  title: "Verifications",
  description:
    "The submit body, the Idempotency-Key contract, polling versus webhooks, listing, reconciliation and cancellation.",
};

export default function VerificationsPage() {
  return (
    <>
      <h1>Verifications</h1>
      <p>
        One submit endpoint serves every tenant and every document type. The template and any
        overrides are data in the body, not a different endpoint per document type.
      </p>

      <h2>The submit body</h2>

      <CodeBlock language="json">{`{
  "reference_id": "EVD233_19_883",
  "client_id": "d894f2a1-0000-4000-8000-000000000000",
  "template": "challan",
  "documents": [
    {"type": "document_id", "document_id": "7c1f9b2e-…"}
  ],
  "expected_values": {
    "company_name": "Acme India Pvt. Ltd.",
    "challan_amount": "45200"
  },
  "callback_url": "https://acme.example.com/webhooks/lensai",
  "priority": 100,
  "metadata": {"your_row_id": 42}
}`}</CodeBlock>

      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Rules</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>reference_id</code>
            </td>
            <td>
              Required, 1–255 chars. <strong>Your</strong> identifier, echoed back untouched. The
              join key into your database.
            </td>
          </tr>
          <tr>
            <td>
              <code>client_id</code>
            </td>
            <td>Required UUID. Must own every document in the array.</td>
          </tr>
          <tr>
            <td>
              <code>template</code>
            </td>
            <td>
              Required, the document type — e.g. <code>challan</code>. Must have an ACTIVE version.
            </td>
          </tr>
          <tr>
            <td>
              <code>documents</code>
            </td>
            <td>
              1–20 entries, each <code>{'{"type":"url","url":…}'}</code> or{" "}
              <code>{'{"type":"document_id","document_id":…}'}</code>. Order matters.
            </td>
          </tr>
          <tr>
            <td>
              <code>expected_values</code>
            </td>
            <td>
              Up to 100 keys. An omitted key is reported <code>NOT_SPECIFIED</code>, not as a
              mismatch.
            </td>
          </tr>
          <tr>
            <td>
              <code>callback_url</code>
            </td>
            <td>Optional. Overrides the client&rsquo;s registered webhook for this job only.</td>
          </tr>
          <tr>
            <td>
              <code>priority</code>
            </td>
            <td>1–1000, default 100. Lower runs first.</td>
          </tr>
          <tr>
            <td>
              <code>metadata</code>
            </td>
            <td>Opaque passthrough, echoed in the webhook and the result.</td>
          </tr>
        </tbody>
      </table>

      <p>
        Which keys a template actually compares is not a guess:{" "}
        <code>GET /templates</code> (with the API key) returns each available template and its{" "}
        <code>expects</code> array.
      </p>

      <CodeBlock language="bash">{`curl ${API_ROOT}/templates -H "x-api-key: $LENSAI_API_KEY"

# [{"name":"challan","version":1,
#   "expects":["authority","challan_amount","challan_date","challan_period","company_name","state"]}]`}</CodeBlock>

      <h2>Idempotency</h2>
      <p>
        Send an <code>Idempotency-Key</code> header on every submit. Reusing your{" "}
        <code>reference_id</code> as the key is the normal choice.
      </p>

      <table>
        <thead>
          <tr>
            <th>Response</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>202 Accepted</code>
            </td>
            <td>A new job was queued.</td>
          </tr>
          <tr>
            <td>
              <code>200 OK</code>
            </td>
            <td>
              A replay. Same key, same body — the original job is returned rather than a second one
              being created.
            </td>
          </tr>
          <tr>
            <td>
              <code>409 request_in_flight</code>
            </td>
            <td>
              The original request for this key has not finished yet. Wait, then re-fetch the
              result.
            </td>
          </tr>
          <tr>
            <td>
              <code>422 idempotency_key_reused</code>
            </td>
            <td>Same key, <strong>different</strong> body. Always a caller bug.</td>
          </tr>
        </tbody>
      </table>

      <p>
        The two success codes are a deliberate signal: your client can see that a retry was
        deduplicated instead of guessing.
      </p>

      <h2>Getting the result</h2>
      <p>
        Both routes return the same answer, and both are authenticated with the API key.
      </p>

      <CodeBlock language="text">{`GET /verifications/{id}          the full result
GET /verifications/{id}/steps    the per-plugin trace behind it`}</CodeBlock>

      <CodeBlock language="json">{`{
  "verification_id": "0f9a…",
  "reference_id": "EVD233_19_883",
  "job_status": "COMPLETED",
  "verdict": "PASS",
  "verdict_reason": "all_mandatory_checks_matched",
  "confidence_score": "100.00",
  "failure_reason": null,
  "extracted_fields": {"company_name": "ACME INDIA PRIVATE LIMITED"},
  "expected_values": {"company_name": "Acme India Pvt. Ltd."},
  "checks": [
    {
      "field_name": "company_name",
      "check_plugin": "check.fuzzy_text",
      "expected_value": "Acme India Pvt. Ltd.",
      "extracted_value": "ACME INDIA PRIVATE LIMITED",
      "match_status": "MATCH",
      "severity": "mandatory",
      "confidence": "97.00",
      "remarks": "Similarity 97% against a threshold of 95%."
    }
  ],
  "extraction_strategy": "text_layer",
  "attempt_count": 1
}`}</CodeBlock>

      <Callout tone="neutral" title="Webhooks are the convenience; polling is the guarantee">
        Whatever happened to the callback, the answer is on{" "}
        <code>GET /verifications/{"{id}"}</code>. A missed webhook is never lost data.
      </Callout>

      <h2>Listing and reconciliation</h2>
      <CodeBlock language="text">{`GET /verifications?updated_since=&reference_id=&job_status=&cursor=&limit=`}</CodeBlock>

      <p>
        <code>limit</code> is 1–200 (default 50). The response carries an opaque{" "}
        <code>next_cursor</code> — pass it back verbatim as <code>cursor</code> and do not parse it.
      </p>
      <p>
        <code>updated_since</code> is the reconciliation sweep: after an outage, ask for everything
        that changed since your last checkpoint and catch up on any webhook you missed. Running it
        nightly turns a whole class of silent data-loss incident into a no-op.
      </p>

      <h2>Cancelling</h2>
      <p>
        <code>POST /verifications/{"{id}"}/cancel</code> works only while the job is{" "}
        <code>QUEUED</code>. Once a worker has claimed it, cancelling would leave that worker
        writing results for a cancelled verification.
      </p>

      <p>
        Next: <Link href="/docs/verdicts">how to read the verdict</Link>, and{" "}
        <Link href="/docs/webhooks">how to receive it</Link>.
      </p>
    </>
  );
}
