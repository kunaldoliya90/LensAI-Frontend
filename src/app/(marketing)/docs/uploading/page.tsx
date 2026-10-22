import Link from "next/link";
import type { Metadata } from "next";
import { CodeBlock } from "@/components/ui/CodeBlock";

export const metadata: Metadata = {
  title: "Submitting documents",
  description:
    "Documents are submitted by URL — a link we fetch once, at processing time. The SSRF guard, multiple documents, and errors.",
};

export default function UploadingPage() {
  return (
    <>
      <h1>Submitting documents</h1>
      <p>
        Documents are submitted by URL — a link we fetch <strong>once</strong>, at processing
        time. There is no upload endpoint and nothing of yours is ever stored by us: we never hold
        the bytes, only the URL and the result.
      </p>

      <CodeBlock language="json">{`"documents": [
  {"type": "url", "url": "https://your-bucket.example.com/challan-april-2026.pdf?sig=…"}
]`}</CodeBlock>

      <h2>How it works</h2>
      <p>
        The URL must be reachable by us over <code>https</code> and is fetched <strong>once</strong>
        , at processing time. Pre-signed URLs should stay valid for at least an hour — a job can be
        queued behind others.
      </p>
      <p>
        We refuse URLs that resolve to private, loopback, link-local or cloud-metadata addresses,
        re-check after every redirect, and verify the address actually connected to rather than the
        one DNS first answered with. A rejected URL returns <code>422 unsafe_url</code>.
      </p>

      <h2>Multiple documents</h2>
      <p>
        <code>documents</code> is an ordered array and the order matters: where two documents
        disagree about a field, the <strong>first non-empty value wins</strong>. Send the most
        authoritative first. Up to 20 per verification.
      </p>

      <CodeBlock language="json">{`"documents": [
  {"type": "url", "url": "https://your-bucket.example.com/challan.pdf?sig=…"},
  {"type": "url", "url": "https://your-bucket.example.com/annexure.pdf?sig=…"}
]`}</CodeBlock>

      <h2>Errors</h2>
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>
              <code>code</code>
            </th>
            <th>Cause</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>401</td>
            <td>
              <code>missing_api_key</code> / <code>invalid_api_key</code>
            </td>
            <td>No or unrecognised <code>x-api-key</code></td>
          </tr>
          <tr>
            <td>403</td>
            <td>
              <code>api_key_pending_approval</code>
            </td>
            <td>Key not yet approved</td>
          </tr>
          <tr>
            <td>422</td>
            <td>
              <code>validation_failed</code>
            </td>
            <td>Unknown <code>client_id</code>, or a malformed <code>documents</code> entry</td>
          </tr>
          <tr>
            <td>422</td>
            <td>
              <code>unsafe_url</code>
            </td>
            <td>A submitted URL points somewhere we will not fetch from</td>
          </tr>
        </tbody>
      </table>

      <p>
        Every error carries a <code>correlation_id</code>. Quote it and support can find the exact
        request — see <Link href="/docs/errors">Errors</Link>.
      </p>
    </>
  );
}
