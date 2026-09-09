import Link from "next/link";
import type { ReactNode } from "react";
import { Callout } from "@/components/ui/Callout";
import { fieldProblems, isApiError } from "@/lib/api/errors";

/**
 * Extra context the API's own message cannot carry — mostly where to go next.
 * The message from the envelope is always shown; this only adds to it.
 */
const GUIDANCE: Record<string, ReactNode> = {
  api_key_pending_approval: (
    <>
      A LensAI administrator has to approve the key before it authenticates. Its status is on{" "}
      <Link href="/app/keys">API keys</Link>.
    </>
  ),
  api_key_revoked: <>This key is permanently unusable. Create a replacement on API keys.</>,
  api_key_expired: <>This key passed its expiry date. Create a replacement on API keys.</>,
  missing_api_key: <>Paste a key into the playground before running a call.</>,
  invalid_api_key: <>The key was not recognised. Check for a truncated paste.</>,
  idempotency_key_reused: (
    <>
      This Idempotency-Key was used with a different body. Either reuse the original body or send a
      new key.
    </>
  ),
  request_in_flight: <>The original request is still processing. Wait, then re-fetch the result.</>,
  document_too_large: <>Uploads are capped at 50 MB.</>,
  unsafe_url: <>The URL is not publicly fetchable. Upload the file instead.</>,
  nature_not_found: (
    <>
      No document type of that name exists. Check <Link href="/app/document-types">Document types</Link>{" "}
      for what LensAI currently supports.
    </>
  ),
  nature_inactive: (
    <>
      This document type exists but has no ACTIVE version. Ask a LensAI administrator to activate
      one — see <Link href="/app/document-types">Document types</Link>.
    </>
  ),
  tenant_suspended: <>Contact your LensAI administrator to restore access.</>,
};

export function ErrorNotice({ error, title }: { error: unknown; title?: string }) {
  const apiError = isApiError(error) ? error : null;
  const message =
    apiError?.message ??
    (error instanceof Error ? error.message : "The request failed for an unknown reason.");
  const problems = apiError ? fieldProblems(apiError) : [];
  const guidance = apiError ? GUIDANCE[apiError.code] : undefined;
  const retryAfter = apiError?.retryAfterSeconds;

  return (
    <Callout tone="fail" title={title ?? "Request failed"}>
      <p>{message}</p>

      {guidance ? <p className="mt-1 [&_a]:text-accent-bright [&_a]:underline">{guidance}</p> : null}

      {retryAfter ? <p className="mt-1">Retry after {retryAfter} seconds.</p> : null}

      {problems.length > 0 ? (
        <ul className="mt-2 list-disc space-y-0.5 pl-5">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      ) : null}

      {apiError ? (
        <p className="mt-2 font-mono text-[11px] text-ink-muted">
          {apiError.code}
          {apiError.correlationId ? ` · correlation ${apiError.correlationId}` : null}
        </p>
      ) : null}
    </Callout>
  );
}
