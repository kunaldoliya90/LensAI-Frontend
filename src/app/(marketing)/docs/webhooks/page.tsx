import Link from "next/link";
import type { Metadata } from "next";
import { Callout } from "@/components/ui/Callout";
import { CodeBlock } from "@/components/ui/CodeBlock";

export const metadata: Metadata = {
  title: "Webhooks",
  description:
    "The three rules, signature verification in Node and Python, the retry schedule, delivery history and replay.",
};

const NODE_SNIPPET = `const crypto = require("node:crypto");
const express = require("express");

// Both are needed during a rotation: LensAI sends two signatures for 24 hours
// after you rotate, so set the new one here and keep the old until it expires.
const SECRETS = [
  process.env.LENSAI_WEBHOOK_SECRET,
  process.env.LENSAI_WEBHOOK_SECRET_PREVIOUS,
].filter(Boolean);

const TOLERANCE_SECONDS = 300;
const app = express();

// express.raw, NOT express.json — the raw bytes are what was signed.
app.post(
  "/webhooks/lensai",
  express.raw({ type: "application/json", limit: "1mb" }),
  handleWebhook,
);

function verifySignature(rawBody, header) {
  if (!header) return false;

  let timestamp = null;
  const signatures = [];
  for (const element of header.split(",")) {
    const [key, value] = element.trim().split("=");
    if (key === "t") timestamp = Number.parseInt(value, 10);
    else if (key === "v1") signatures.push(value);
  }
  if (!Number.isInteger(timestamp) || signatures.length === 0) return false;

  // Replay protection. Without it a captured payload stays valid forever.
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > TOLERANCE_SECONDS) return false;

  const message = Buffer.concat([Buffer.from(\`\${timestamp}.\`), rawBody]);
  const expected = SECRETS.map((secret) =>
    crypto.createHmac("sha256", secret).update(message).digest("hex"),
  );

  // timingSafeEqual, never ===. A plain comparison on a hex digest leaks its
  // answer through timing, one byte at a time.
  return signatures.some((candidate) =>
    expected.some((valid) => {
      const a = Buffer.from(candidate);
      const b = Buffer.from(valid);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    }),
  );
}

function handleWebhook(req, res) {
  if (!verifySignature(req.body, req.get("X-LensAI-Signature"))) {
    return res.status(401).send("bad signature");
  }

  const eventId = req.get("X-LensAI-Event-Id");
  if (alreadyProcessed(eventId)) return res.sendStatus(200); // duplicate

  const event = JSON.parse(req.body.toString("utf8"));

  // Acknowledge first, work afterwards. We time out at 10 seconds.
  res.sendStatus(200);
  enqueueForProcessing(event);
}`;

const PYTHON_SNIPPET = `import hashlib
import hmac
import os
import time

from fastapi import FastAPI, HTTPException, Request, Response, status

SECRETS = [
    secret
    for secret in (
        os.environ.get("LENSAI_WEBHOOK_SECRET", ""),
        os.environ.get("LENSAI_WEBHOOK_SECRET_PREVIOUS", ""),
    )
    if secret
]
TOLERANCE_SECONDS = 300

app = FastAPI()


def verify_signature(raw_body: bytes, header: str) -> None:
    """Raise 401 unless the payload is authentic and fresh.

    raw_body must be the bytes as received. Verifying against
    json.dumps(await request.json()) re-serializes the object — different key
    order, different spacing — and every signature fails.
    """
    if not header:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing signature")

    timestamp: int | None = None
    signatures: list[str] = []
    for element in header.split(","):
        key, _, value = element.strip().partition("=")
        if key == "t":
            timestamp = int(value) if value.isdigit() else None
        elif key == "v1":
            signatures.append(value)

    if timestamp is None or not signatures:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Malformed signature header")

    if abs(int(time.time()) - timestamp) > TOLERANCE_SECONDS:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Timestamp outside tolerance")

    message = f"{timestamp}.".encode() + raw_body
    expected = {
        hmac.new(secret.encode(), message, hashlib.sha256).hexdigest() for secret in SECRETS
    }
    if not any(hmac.compare_digest(c, v) for c in signatures for v in expected):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "No signature matched")


@app.post("/webhooks/lensai")
async def receive(request: Request) -> Response:
    raw_body = await request.body()
    verify_signature(raw_body, request.headers.get("X-LensAI-Signature", ""))

    event_id = request.headers["X-LensAI-Event-Id"]
    if already_processed(event_id):
        return Response(status_code=200)

    # Acknowledge first, work afterwards.
    enqueue_for_processing(raw_body)
    return Response(status_code=200)`;

export default function WebhooksPage() {
  return (
    <>
      <h1>Webhooks</h1>
      <p>
        You submit a document. We verify it. We POST the result to your endpoint, and your code
        writes it into your database. LensAI never connects to your database, holds no credentials
        of yours, and is not inside your network. The join key is your own{" "}
        <code>reference_id</code>.
      </p>

      <h2>Three rules</h2>
      <p>Everything else on this page is detail. These three are not optional.</p>

      <h3>1. Be idempotent on event_id</h3>
      <p>
        Delivery is <strong>at-least-once</strong>. You will receive duplicates — after a network
        timeout where your 200 never reached us, after a retry, after a replay from the console.
        That is normal operation, not a fault.
      </p>

      <CodeBlock language="sql">{`-- The whole mechanism.
INSERT INTO lensai_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING;
-- 0 rows affected -> already processed -> return 200 and stop.`}</CodeBlock>

      <p>
        <code>event_id</code> is also in the <code>X-LensAI-Event-Id</code> header, so you can
        deduplicate before parsing the body.
      </p>

      <h3>2. Return 2xx within 10 seconds</h3>
      <p>
        We time out at 10 seconds and treat it as a failure.{" "}
        <strong>Acknowledge first, work afterwards</strong> — write the event to your own queue or
        table, return 200, and process it out of band. An endpoint that runs a 30-second
        reconciliation inline will be retried while it is still working, and now it is running
        twice.
      </p>
      <p>
        Any 2xx is success. A 4xx other than 408 and 429 tells us to stop permanently.
      </p>

      <h3>3. Never trust an unsigned payload</h3>
      <p>
        Your endpoint is a URL on the public internet. Without signature verification, anyone who
        learns it can POST <code>&quot;verdict&quot;: &quot;PASS&quot;</code> for any{" "}
        <code>reference_id</code> they like, and your compliance records will say a document passed
        that nobody ever checked. Verify <strong>before</strong> you parse.
      </p>

      <h2>The payload</h2>

      <CodeBlock language="json">{`{
  "version": "1.0",
  "event_id": "evt_9f2c1a7b5e4d4c8fa1b2c3d4e5f6a7b8",
  "event_type": "verification.completed",
  "sequence": 3,
  "created_at": "2026-08-12T09:14:22.481+00:00",
  "data": {
    "verification_id": "0f9a…",
    "reference_id": "EVD233_19_883",
    "client_id": "d894…",
    "template": "challan",
    "job_status": "COMPLETED",
    "verdict": "PASS",
    "verdict_reason": "all_mandatory_checks_matched",
    "confidence_score": "100.00",
    "extracted_fields": {"company_name": "ACME INDIA PRIVATE LIMITED"},
    "checks": [
      {
        "field_name": "company_name",
        "expected_value": "Acme India Pvt. Ltd.",
        "extracted_value": "ACME INDIA PRIVATE LIMITED",
        "match_status": "MATCH",
        "severity": "mandatory",
        "remarks": "Similarity 97% against a threshold of 95%."
      }
    ],
    "metadata": {"your_row_id": 42},
    "completed_at": "2026-08-12T09:14:22.104+00:00"
  }
}`}</CodeBlock>

      <h3>Two event types, and why they are separate</h3>
      <table>
        <thead>
          <tr>
            <th>
              <code>event_type</code>
            </th>
            <th>Meaning</th>
            <th>What you do</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>verification.completed</code>
            </td>
            <td>We ran the pipeline and reached a conclusion</td>
            <td>Record the verdict</td>
          </tr>
          <tr>
            <td>
              <code>verification.failed</code>
            </td>
            <td>
              We could <strong>not</strong> run the pipeline
            </td>
            <td>Retry later, or route to a human</td>
          </tr>
        </tbody>
      </table>

      <Callout tone="warn" title="verification.failed carries no verdict field at all">
        Not a null one. &ldquo;Our OCR crashed&rdquo; is not &ldquo;this document is
        non-compliant&rdquo;, and the two must never end up in the same column.
      </Callout>

      <h3>Ordering</h3>
      <p>
        <code>sequence</code> is monotonic per <code>(account, reference_id)</code>. Deliveries are
        concurrent and retried independently, so a later event can overtake an earlier one. The rule
        is one line:
      </p>

      <CodeBlock language="python">{`if event["sequence"] <= last_applied_sequence_for(reference_id):
    return 200  # stale; already superseded`}</CodeBlock>

      <h2>Headers</h2>
      <table>
        <thead>
          <tr>
            <th>Header</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>X-LensAI-Signature</code>
            </td>
            <td>
              <code>t=&lt;unix&gt;,v1=&lt;hex&gt;[,v1=&lt;hex&gt;]</code> — verify this
            </td>
          </tr>
          <tr>
            <td>
              <code>X-LensAI-Event-Id</code>
            </td>
            <td>Deduplicate before parsing</td>
          </tr>
          <tr>
            <td>
              <code>X-LensAI-Event-Type</code>
            </td>
            <td>Route before parsing</td>
          </tr>
          <tr>
            <td>
              <code>X-LensAI-Delivery-Attempt</code>
            </td>
            <td>1–7. Useful in your logs</td>
          </tr>
        </tbody>
      </table>

      <h2>Signature verification</h2>
      <p>
        The signed material is <code>{"{timestamp}.{raw_request_body}"}</code>, HMAC-SHA256, hex
        encoded. The timestamp is inside the signed material deliberately: without it a captured
        payload replays forever, because the attacker changes nothing.
      </p>

      <Callout tone="warn" title="Verify against the raw bytes of the request">
        Not against a re-serialized object. <code>json.dumps(request.json())</code> produces
        different bytes from what we signed — different key order, different spacing — and{" "}
        <em>every</em> signature fails, in a way that looks like a wrong secret rather than a
        re-serialized body.
      </Callout>

      <p>
        During a rotation we send <strong>two</strong> <code>v1</code> signatures, one per secret.
        Accept the payload if either matches. That is what lets you deploy a new secret without
        coordinating a cutover with us.
      </p>

      <h3>Node — Express</h3>
      <CodeBlock language="javascript">{NODE_SNIPPET}</CodeBlock>

      <h3>Python — FastAPI</h3>
      <CodeBlock language="python">{PYTHON_SNIPPET}</CodeBlock>

      <h2>Retries</h2>
      <p>
        7 attempts over roughly 12 hours: immediate, then 30s, 2m, 8m, 32m, 2h, 8h. After that the
        delivery is dead-lettered — kept, and replayable from the console.
      </p>
      <p>
        A missed webhook is never lost data. <code>GET /verifications/{"{id}"}</code> and{" "}
        <code>GET /verifications?updated_since=…</code> return the same result.
      </p>

      <h2>Delivery history and replay</h2>
      <p>
        <Link href="/app/deliveries">Deliveries</Link> in the console shows what we tried to send
        you, with the HTTP status and error of each attempt — the first place to look when an event
        did not arrive. Filter by <code>reference_id</code> or status. Payloads are deliberately not
        in that list: a list endpoint returning every body would be a bulk export of extracted
        document values.
      </p>

      <Callout tone="warn" title="A replay keeps the original event_id">
        If you already processed that event, your consumer must see the duplicate and drop it. Rule
        1 is exactly what makes replay safe to use.
      </Callout>

      <h2>Registering an endpoint</h2>
      <p>
        Register one per client on <Link href="/app/webhooks">Webhooks</Link>. The signing secret is
        returned <strong>once</strong> and is not retrievable afterwards — the same rule as an API
        key. It lives in a secret store, never in the database, so a database dump contains nothing
        that could forge a webhook.
      </p>
      <p>
        Subscribe to <code>verification.completed</code>, <code>verification.failed</code>, or
        neither — an empty list means all of them, which is the sensible default for a client who
        registered one URL.
      </p>
    </>
  );
}
