"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { DocumentInput, DocumentUploaded } from "@/lib/api/types";
import { parseJsonObject } from "@/lib/json";
import { listSubmittableNatures, submitVerification } from "../api/playground";
import { ExpectedValuesFields } from "./ExpectedValuesFields";

const MAX_DOCUMENTS = 20;

export function SubmitVerificationForm({
  apiKey,
  clientId,
  uploads,
  onSubmitted,
}: {
  apiKey: string;
  clientId: string;
  uploads: DocumentUploaded[];
  onSubmitted: (verificationId: string, wasReplay: boolean) => void;
}) {
  const [referenceId, setReferenceId] = useState("");
  const [natureName, setNatureName] = useState("");
  const [excludedUploads, setExcludedUploads] = useState<string[]>([]);
  const [urlsText, setUrlsText] = useState("");
  const [expectedValues, setExpectedValues] = useState<Record<string, string>>({});
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [metadataText, setMetadataText] = useState("");

  const natures = useQuery({
    queryKey: ["submittable-natures", apiKey],
    queryFn: () => listSubmittableNatures(apiKey),
  });

  const selected = natures.data?.find((nature) => nature.name === natureName);

  const documents: DocumentInput[] = [
    ...uploads
      .filter((upload) => !excludedUploads.includes(upload.document_id))
      .map<DocumentInput>((upload) => ({
        type: "document_id",
        document_id: upload.document_id,
        file_name: upload.file_name,
      })),
    ...urlsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map<DocumentInput>((url) => ({ type: "url", url })),
  ];

  const metadata = metadataText.trim() ? parseJsonObject(metadataText) : null;
  const metadataError = metadata && !metadata.ok ? metadata.error : undefined;

  const submit = useMutation({
    mutationFn: submitVerification,
    onSuccess: (result) => onSubmitted(result.accepted.verification_id, result.wasReplay),
  });

  const canSubmit =
    referenceId.trim() !== "" &&
    selected !== undefined &&
    documents.length > 0 &&
    documents.length <= MAX_DOCUMENTS &&
    !metadataError &&
    !submit.isPending;

  const run = () =>
    selected !== undefined &&
    submit.mutate({
      apiKey,
      // The reference_id is the natural key: retrying the same record must not
      // create a second job.
      idempotencyKey: idempotencyKey.trim() || referenceId.trim(),
      body: {
        reference_id: referenceId.trim(),
        client_id: clientId,
        // The API takes the nature's `code`, not its name — the dropdown
        // below is keyed on name only because it is friendlier to read.
        nature: selected.code,
        documents,
        expected_values: Object.fromEntries(
          Object.entries(expectedValues).filter(
            ([key, value]) => value.trim() !== "" && selected?.expects.includes(key),
          ),
        ),
        callback_url: callbackUrl.trim() || undefined,
        metadata: metadata?.ok ? metadata.value : undefined,
      },
    });

  return (
    <section className="panel p-4">
      <h2 className="text-[12.5px] font-medium">Submit a verification</h2>

      <div className="mt-4 grid gap-4">
        {natures.isError ? (
          <ErrorNotice error={natures.error} title="Could not load document types" />
        ) : null}
        {submit.isError ? <ErrorNotice error={submit.error} title="Submission refused" /> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="reference_id"
            required
            mono
            placeholder="EVD233_19_883"
            hint="Your identifier, echoed back untouched in every result and webhook."
            value={referenceId}
            onChange={(event) => setReferenceId(event.target.value)}
          />

          <Select
            label="Document type"
            required
            hint={
              natures.isPending
                ? "Loading from GET /natures with your API key…"
                : "Only natures with an ACTIVE version can be submitted against."
            }
            value={natureName}
            onChange={(event) => setNatureName(event.target.value)}
          >
            <option value="">Select a document type</option>
            {natures.data?.map((nature) => (
              <option key={`${nature.name}-${nature.version}`} value={nature.name}>
                {nature.label} (v{nature.version}) — nature: {nature.code}
              </option>
            ))}
          </Select>
        </div>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Documents</legend>
          <p className="text-[13px] text-ink-muted">
            Order matters: where two documents disagree about a field, the first non-empty value
            wins. Up to {MAX_DOCUMENTS} per verification.
          </p>

          {uploads.length === 0 ? (
            <p className="text-[13px] text-ink-muted">
              Nothing uploaded in this session yet. You can still submit a URL below.
            </p>
          ) : (
            uploads.map((upload) => (
              <Checkbox
                key={upload.document_id}
                checked={!excludedUploads.includes(upload.document_id)}
                onChange={(event) =>
                  setExcludedUploads((current) =>
                    event.target.checked
                      ? current.filter((id) => id !== upload.document_id)
                      : [...current, upload.document_id],
                  )
                }
                label={
                  <span>
                    {upload.file_name}{" "}
                    <code className="font-mono text-[12px] text-ink-muted">
                      {upload.document_id.slice(0, 8)}…
                    </code>
                  </span>
                }
              />
            ))
          )}

          <Textarea
            label="Document URLs"
            mono
            rows={2}
            hint="One HTTPS URL per line. Fetched once, at processing time; private and metadata addresses are refused."
            value={urlsText}
            onChange={(event) => setUrlsText(event.target.value)}
          />
        </fieldset>

        <ExpectedValuesFields
          fields={selected?.fields ?? []}
          values={expectedValues}
          onChange={(key, value) =>
            setExpectedValues((current) => ({ ...current, [key]: value }))
          }
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Idempotency-Key"
            mono
            placeholder={referenceId || "defaults to reference_id"}
            hint="Same key, same body replays the original job with 200 instead of creating a second one."
            value={idempotencyKey}
            onChange={(event) => setIdempotencyKey(event.target.value)}
          />

          <Input
            label="callback_url"
            type="url"
            hint="Optional. Overrides the client's registered webhook for this job only."
            value={callbackUrl}
            onChange={(event) => setCallbackUrl(event.target.value)}
          />
        </div>

        <Textarea
          label="metadata"
          mono
          rows={3}
          hint='Optional JSON object, echoed back in the result and the webhook. e.g. {"your_row_id": 42}'
          error={metadataError}
          value={metadataText}
          onChange={(event) => setMetadataText(event.target.value)}
        />

        {documents.length > MAX_DOCUMENTS ? (
          <Callout tone="fail">
            {documents.length} documents selected. The API accepts at most {MAX_DOCUMENTS}.
          </Callout>
        ) : null}

        <div>
          <Button disabled={!canSubmit} onClick={run}>
            {submit.isPending ? "Submitting…" : "Submit verification"}
          </Button>
        </div>
      </div>
    </section>
  );
}
