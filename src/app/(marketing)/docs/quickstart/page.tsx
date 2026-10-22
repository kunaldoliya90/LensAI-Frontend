import Link from "next/link";
import type { Metadata } from "next";
import { Callout } from "@/components/ui/Callout";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { API_ROOT } from "@/lib/api/config";

export const metadata: Metadata = {
  title: "Quickstart",
  description: "First key, first document, first verification — in the order they have to happen.",
};

export default function QuickstartPage() {
  return (
    <>
      <h1>Quickstart</h1>
      <p>
        Four steps from an empty account to a verdict. Everything after step 2 runs from your
        backend with an <code>x-api-key</code>; steps 1 and 2 happen once, in the console.
      </p>

      <h2>1. Create an account and a client</h2>
      <p>
        <Link href="/signup">Sign up</Link> to create your tenant and its first user. Then create a
        <strong> client</strong> on <Link href="/app/clients">Clients</Link>. A client is the entity
        a job belongs to — your own customer, subsidiary or business unit. Every webhook endpoint
        and verification hangs off a <code>client_id</code>, so nothing else works until one
        exists.
      </p>

      <h2>2. Request an API key</h2>
      <p>
        On <Link href="/app/keys">API keys</Link>, create a key and choose{" "}
        <code>SANDBOX</code> or <code>PRODUCTION</code>. The plaintext key is shown{" "}
        <strong>once</strong>. LensAI stores only a peppered hash and the display prefix, so there
        is no way to recover it later.
      </p>

      <Callout tone="warn" title="A new key does not authenticate yet">
        Keys are created <code>PENDING</code>. Until a LensAI administrator approves it, every call
        returns <code>403 api_key_pending_approval</code>. That is the expected first response, not
        a broken key.
      </Callout>

      <p>Once approved, confirm what it resolves to:</p>

      <CodeBlock language="bash">{`curl ${API_ROOT}/portal/whoami \\
  -H "x-api-key: $LENSAI_API_KEY"

# {"tenant_id":"…","api_key_id":"…","environment":"SANDBOX","rate_limit_tier":"sandbox"}`}</CodeBlock>

      <h2>3. Submit the verification</h2>
      <p>
        A document is submitted as a URL we fetch once, at processing time — see{" "}
        <Link href="/docs/uploading">Submitting documents</Link> for what that URL can be (an S3
        URL, a presigned URL, a Google Drive link) and the safety checks we run against it.
      </p>
      <p>
        <code>expected_values</code> is what you believe the document says. Each key is compared
        field by field against what was extracted; a key you omit is reported{" "}
        <code>NOT_SPECIFIED</code> rather than as a mismatch.
      </p>

      <CodeBlock language="bash">{`curl -X POST ${API_ROOT}/verifications \\
  -H "x-api-key: $LENSAI_API_KEY" \\
  -H "Idempotency-Key: EVD233_19_883" \\
  -H "Content-Type: application/json" \\
  -d '{
    "reference_id": "EVD233_19_883",
    "client_id": "'$LENSAI_CLIENT_ID'",
    "template": "challan",
    "documents": [
      {"type": "url", "url": "https://your-bucket.example.com/challan-april-2026.pdf?sig=..."}
    ],
    "expected_values": {
      "company_name": "Acme India Pvt. Ltd.",
      "challan_amount": "45200",
      "challan_date": "12-04-2026"
    }
  }'

# 202 Accepted
# {"verification_id":"0f9a…","reference_id":"EVD233_19_883","job_status":"QUEUED", …}`}</CodeBlock>

      <p>
        <code>reference_id</code> is <em>your</em> identifier. It is echoed back untouched in every
        result and in the webhook, and it is how you join our answer to your row.
      </p>

      <h2>4. Take the result</h2>
      <p>
        The verdict arrives as a signed <code>verification.completed</code> webhook, and is always
        retrievable regardless of what happened to that delivery:
      </p>

      <CodeBlock language="bash">{`curl ${API_ROOT}/verifications/0f9a… \\
  -H "x-api-key: $LENSAI_API_KEY"`}</CodeBlock>

      <p>
        Read <Link href="/docs/verdicts">Verdicts</Link> before you write the result into your
        database, and <Link href="/docs/webhooks">Webhooks</Link> before you expose an endpoint.
      </p>

      <h2>Try it without writing code</h2>
      <p>
        The <Link href="/app/playground">Playground</Link> runs all of the above with a key you
        paste into the browser: submit, poll, and read the per-plugin trace. The key is kept in{" "}
        <code>sessionStorage</code> and is never sent to LensAI&rsquo;s own servers as anything
        other than the <code>x-api-key</code> header on those calls.
      </p>
    </>
  );
}
