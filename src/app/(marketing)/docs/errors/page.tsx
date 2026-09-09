import type { Metadata } from "next";
import { Callout } from "@/components/ui/Callout";
import { CodeBlock } from "@/components/ui/CodeBlock";

export const metadata: Metadata = {
  title: "Errors",
  description:
    "The error envelope, and every code the API can return grouped by whether retrying can help.",
};

interface ErrorCode {
  code: string;
  status: number;
  meaning: string;
}

const CLIENT_ERRORS: ErrorCode[] = [
  { code: "validation_failed", status: 422, meaning: "The body or parameters are invalid. Field-level detail is in details.errors." },
  { code: "missing_api_key", status: 401, meaning: "No x-api-key header was sent." },
  { code: "invalid_api_key", status: 401, meaning: "The key is not recognised." },
  { code: "api_key_pending_approval", status: 403, meaning: "A real key that no administrator has approved yet." },
  { code: "api_key_revoked", status: 403, meaning: "Terminal. Issue a new key." },
  { code: "api_key_expired", status: 403, meaning: "Past its expires_at." },
  { code: "tenant_suspended", status: 403, meaning: "Account-level block. Every key for the tenant fails identically." },
  { code: "not_authorized", status: 403, meaning: "The session is not permitted here — usually a non-admin on an admin route." },
  { code: "rate_limited", status: 429, meaning: "Tier limit exceeded for this key. Honour the Retry-After header." },
  { code: "idempotency_key_reused", status: 422, meaning: "The same Idempotency-Key arrived with a different body." },
  { code: "request_in_flight", status: 409, meaning: "The original request for this key has not finished. Wait and re-fetch." },
  { code: "document_too_large", status: 413, meaning: "Over the 50 MB upload cap." },
  { code: "document_unprocessable", status: 422, meaning: "Corrupt, encrypted, or not a PDF, PNG, JPEG or WebP." },
  { code: "unsafe_url", status: 422, meaning: "A submitted URL resolves somewhere we refuse to fetch from." },
  { code: "template_not_found", status: 404, meaning: "No template of that name resolves for this account." },
  { code: "template_inactive", status: 422, meaning: "The template exists but no version is ACTIVE." },
  { code: "config_invalid", status: 422, meaning: "A template config failed validation." },
  { code: "provider_incompatible", status: 422, meaning: "The template needs a capability your model does not declare." },
  { code: "no_provider_configured", status: 422, meaning: "STRICT, and none of your providers is usable. Nothing was sent anywhere." },
];

const TRANSIENT_ERRORS: ErrorCode[] = [
  { code: "provider_unavailable", status: 503, meaning: "The AI endpoint timed out or returned 5xx." },
  { code: "provider_rate_limited", status: 503, meaning: "The AI provider rate-limited us. Their Retry-After is honoured." },
  { code: "document_unreachable", status: 502, meaning: "A document URL could not be fetched." },
  { code: "storage_unavailable", status: 503, meaning: "Object storage is temporarily unreachable." },
];

const TERMINAL_ERRORS: ErrorCode[] = [
  { code: "provider_auth_failed", status: 502, meaning: "Your provider credential was rejected, or none is stored. Not retried." },
  { code: "extraction_unparseable", status: 502, meaning: "The model could not produce schema-conforming JSON, even after repair." },
  { code: "mandatory_step_failed", status: 500, meaning: "A mandatory pipeline step could not run." },
  { code: "unknown_plugin", status: 500, meaning: "A config names a plugin that is not in the registry." },
  { code: "internal_error", status: 500, meaning: "An unhandled fault. The message is deliberately opaque; the correlation_id finds the log." },
];

function ErrorTable({ codes }: { codes: ErrorCode[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>
            <code>code</code>
          </th>
          <th>HTTP</th>
          <th>Meaning</th>
        </tr>
      </thead>
      <tbody>
        {codes.map((entry) => (
          <tr key={entry.code}>
            <td>
              <code>{entry.code}</code>
            </td>
            <td>{entry.status}</td>
            <td>{entry.meaning}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ErrorsPage() {
  return (
    <>
      <h1>Errors</h1>
      <p>
        Every non-2xx response — from a validation failure to an unhandled fault — has the same
        shape. Handle the envelope once and every route is covered.
      </p>

      <CodeBlock language="json">{`{
  "error": {
    "code": "idempotency_key_reused",
    "message": "This Idempotency-Key was used with a different request body.",
    "correlation_id": "6b1f0c2e-2f3a-4d1b-9c77-0a2f5d3e91aa",
    "details": {}
  }
}`}</CodeBlock>

      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Use it for</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>code</code>
            </td>
            <td>Branching in your code. Stable; the message is not.</td>
          </tr>
          <tr>
            <td>
              <code>message</code>
            </td>
            <td>Showing a human. Written to be shown as-is.</td>
          </tr>
          <tr>
            <td>
              <code>correlation_id</code>
            </td>
            <td>Support. Quote it and the exact request is findable in the logs.</td>
          </tr>
          <tr>
            <td>
              <code>details</code>
            </td>
            <td>
              Structured extras — <code>details.errors</code> carries field-level validation
              failures.
            </td>
          </tr>
        </tbody>
      </table>

      <Callout tone="neutral" title="Send your own correlation id">
        Set <code>X-Correlation-ID</code> on any request and it flows through our logs and comes
        back on the error. This console sets one on every call it makes.
      </Callout>

      <h2>Client errors — your input. Never retry unchanged.</h2>
      <ErrorTable codes={CLIENT_ERRORS} />

      <h2>Transient — ours or a dependency&rsquo;s. Retry with backoff.</h2>
      <ErrorTable codes={TRANSIENT_ERRORS} />

      <h2>Terminal — permanent for this input. Do not retry.</h2>
      <ErrorTable codes={TERMINAL_ERRORS} />

      <h2>Handling them</h2>
      <CodeBlock language="python">{`response = httpx.post(url, json=body, headers=headers)

if response.status_code == 429:
    sleep(int(response.headers.get("Retry-After", "60")))
    retry()
elif response.status_code >= 500 or response.status_code == 502:
    retry_with_backoff()
elif not response.is_success:
    error = response.json()["error"]
    # code drives the branch; correlation_id goes into your log line.
    log.error("lensai rejected the call", code=error["code"], cid=error["correlation_id"])
    raise NotRetryable(error["message"])`}</CodeBlock>

      <Callout tone="warn" title="A 500 message is deliberately vague">
        Unhandled faults return &ldquo;An unexpected error occurred.&rdquo; and nothing more. The
        detail is in our logs, reachable by <code>correlation_id</code> — leaking{" "}
        <code>str(exception)</code> to a caller has, in other systems, leaked connection strings and
        bearer tokens.
      </Callout>
    </>
  );
}
