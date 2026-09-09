import Link from "next/link";
import type { Metadata } from "next";
import { Callout } from "@/components/ui/Callout";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { API_ROOT } from "@/lib/api/config";

export const metadata: Metadata = {
  title: "Uploading documents",
  description:
    "Upload the bytes to POST /documents or pass a pre-signed URL. Formats, the 50 MB cap, retention and the SSRF guard.",
};

export default function UploadingPage() {
  return (
    <>
      <h1>Uploading documents</h1>
      <p>
        Two ways to get a document to us. Pick per document — a single verification can mix them.
      </p>

      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>When to use it</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Upload</strong> — <code>POST /documents</code>
            </td>
            <td>You hold the file. Nothing of yours has to be reachable from the internet.</td>
          </tr>
          <tr>
            <td>
              <strong>URL</strong> — <code>{'{"type": "url"}'}</code>
            </td>
            <td>The file already sits behind a pre-signed URL we can GET once.</td>
          </tr>
        </tbody>
      </table>

      <p>
        Uploading is the default recommendation. It is one extra request, and it means you never
        publish a challan — even briefly, even behind an unguessable URL.
      </p>

      <h2>Upload, then submit</h2>

      <CodeBlock language="bash">{`curl -X POST ${API_ROOT}/documents \\
  -H "x-api-key: $LENSAI_API_KEY" \\
  -F "client_id=d894f2a1-0000-4000-8000-000000000000" \\
  -F "file=@challan-april-2026.pdf"`}</CodeBlock>

      <CodeBlock language="json">{`{
  "document_id": "7c1f9b2e-0000-4000-8000-000000000000",
  "client_id": "d894f2a1-0000-4000-8000-000000000000",
  "file_name": "challan-april-2026.pdf",
  "content_type": "application/pdf",
  "size_bytes": 184213,
  "sha256": "9f2c1a7b5e4d4c8fa1b2c3d4e5f6a7b8…",
  "uploaded_at": "2026-08-13T09:14:22.481+00:00",
  "expires_at": "2026-09-12T09:14:22.481+00:00"
}`}</CodeBlock>

      <p>
        Pass the handle back in a verification&rsquo;s <code>documents</code> array as{" "}
        <code>{'{"type": "document_id", "document_id": "…"}'}</code>.
      </p>

      <h2>What you need to know</h2>

      <h3>The format comes from the bytes</h3>
      <p>
        Not the extension, and not the <code>Content-Type</code> your HTTP library guessed. A ZIP
        named <code>challan.pdf</code> is rejected at upload with{" "}
        <code>document_unprocessable</code> rather than failing thirty seconds into a job. Accepted:{" "}
        <strong>PDF, PNG, JPEG, WebP</strong>.
      </p>

      <h3>50 MB cap</h3>
      <p>
        Anything larger returns <code>413 document_too_large</code>.
      </p>

      <h3>client_id is part of the upload</h3>
      <p>
        A document uploaded for one of your clients cannot be submitted under another; the mismatch
        is refused. It is the mistake that otherwise attaches the wrong evidence to a verdict,
        silently.
      </p>

      <h3>Check the sha256</h3>
      <p>
        It is the hash of the bytes as stored. Compare it against your own if you want certainty the
        upload arrived intact.
      </p>

      <h3>Documents expire; verdicts do not</h3>
      <p>
        <code>expires_at</code> is when the source bytes are removed by a retention sweep that runs
        hourly. Verdicts, extracted fields and per-field results outlive them — what disappears is
        the file, not the answer. A document still attached to an unfinished job is never swept,
        however old it is.
      </p>

      <h3>One upload, many verifications</h3>
      <p>
        Re-running a document against a corrected <code>expected_values</code> costs nothing extra:
        submit the same <code>document_id</code> again.
      </p>

      <h2>Multiple documents</h2>
      <p>
        <code>documents</code> is an ordered array and the order matters: where two documents
        disagree about a field, the <strong>first non-empty value wins</strong>. Send the most
        authoritative first. Up to 20 per verification.
      </p>

      <CodeBlock language="json">{`"documents": [
  {"type": "document_id", "document_id": "7c1f9b2e-…"},
  {"type": "url", "url": "https://your-bucket.example.com/annexure.pdf?sig=…"}
]`}</CodeBlock>

      <h2>Managing uploads</h2>
      <CodeBlock language="text">{`GET    /documents/{document_id}     metadata (not the bytes)
DELETE /documents/{document_id}     remove an upload you have not submitted`}</CodeBlock>

      <p>
        <code>DELETE</code> is refused once a verification cites the document — evidence that can be
        removed from under a verdict is not evidence. Those leave through retention instead.
      </p>

      <Callout tone="neutral" title="We do not serve the bytes back">
        <code>GET /documents/{"{id}"}</code> returns metadata only. LensAI holds your documents to
        verify them, not to distribute them; serving the content would put a fetchable URL for a
        challan behind nothing but an API key.
      </Callout>

      <h2>If you use URLs instead</h2>
      <p>
        The URL must be reachable by us over <code>https</code> and is fetched <strong>once</strong>
        , at processing time. Pre-signed URLs should stay valid for at least an hour — a job can be
        queued behind others.
      </p>
      <p>
        We refuse URLs that resolve to private, loopback, link-local or cloud-metadata addresses,
        re-check after every redirect, and verify the address actually connected to rather than the
        one DNS first answered with. A rejected URL returns <code>422 unsafe_url</code>. If your
        storage is internal-only, upload instead — that path does no network fetch at all.
      </p>

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
            <td>413</td>
            <td>
              <code>document_too_large</code>
            </td>
            <td>Over 50 MB</td>
          </tr>
          <tr>
            <td>422</td>
            <td>
              <code>document_unprocessable</code>
            </td>
            <td>Not a PDF, PNG, JPEG or WebP</td>
          </tr>
          <tr>
            <td>422</td>
            <td>
              <code>validation_failed</code>
            </td>
            <td>
              Unknown <code>client_id</code>, unknown <code>document_id</code>, or an empty file
            </td>
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
