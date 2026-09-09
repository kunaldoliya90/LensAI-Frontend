"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Input } from "@/components/ui/Input";
import { JsonEditor } from "@/components/ui/JsonEditor";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { useUrlParams } from "@/hooks/useUrlParams";
import { isApiError } from "@/lib/api/errors";
import { formatInteger } from "@/lib/format";
import { parseJsonObject } from "@/lib/json";
import { getReferenceData, listReferenceData, saveReferenceData } from "../api/referenceData";

const EMPTY_MAPPING = "{\n  \n}";

export function ReferenceDataEditor({ tableKey }: { tableKey: string }) {
  const queryClient = useQueryClient();
  const { params, setParams } = useUrlParams();
  const requestedVersion = Number(params.get("version")) || undefined;

  const [draft, setDraft] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);

  const tables = useQuery({ queryKey: ["reference-data"], queryFn: listReferenceData });
  const summary = tables.data?.find((table) => table.key === tableKey);

  const detail = useQuery({
    queryKey: ["reference-data", tableKey, requestedVersion ?? "latest"],
    queryFn: () => getReferenceData(tableKey, requestedVersion),
    // A key that has never been saved has nothing to fetch; 404 is expected.
    enabled: summary !== undefined,
    retry: false,
  });

  const notFound = isApiError(detail.error) && detail.error.status === 404;

  const text = draft ?? (detail.data ? JSON.stringify(detail.data.mapping, null, 2) : EMPTY_MAPPING);
  const parsed = parseJsonObject(text);
  const descriptionValue = description ?? detail.data?.description ?? "";

  const save = useMutation({
    mutationFn: saveReferenceData,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reference-data"] });
      setDraft(null);
      setDescription(null);
      setParams({ version: null });
    },
  });

  return (
    <>
      <PageHeader
        title={tableKey}
        description={
          summary
            ? `Latest version is v${summary.version} with ${formatInteger(summary.entry_count)} entries. Saving writes a new version.`
            : "This table has not been saved yet. Saving creates version 1."
        }
        actions={
          <Link
            href="/app/reference-data"
            className="text-sm text-accent-bright underline underline-offset-2"
          >
            All tables
          </Link>
        }
      />

      {tables.isError ? <ErrorNotice error={tables.error} /> : null}
      {detail.isError && !notFound ? <ErrorNotice error={detail.error} /> : null}
      {save.isError ? <ErrorNotice error={save.error} title="Could not save the table" /> : null}

      {save.isSuccess ? (
        <Callout tone="pass" title={`Saved as v${save.data.version}`}>
          {formatInteger(save.data.entry_count)} entries stored. Jobs submitted from now on freeze
          this version.
        </Callout>
      ) : null}

      <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
        {summary && summary.version > 1 ? (
          <Select
            label="Version"
            hint="Look at the map a past verdict was produced with."
            value={String(requestedVersion ?? summary.version)}
            onChange={(event) => {
              setDraft(null);
              setDescription(null);
              setParams({ version: event.target.value });
            }}
          >
            {Array.from({ length: summary.version }, (_, index) => summary.version - index).map(
              (version) => (
                <option key={version} value={version}>
                  v{version}
                  {version === summary.version ? " (latest)" : ""}
                </option>
              ),
            )}
          </Select>
        ) : null}

        <Input
          label="Description"
          maxLength={500}
          hint="Optional note stored with this version."
          value={descriptionValue}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      {detail.isPending && summary ? (
        <p className="text-sm text-ink-muted">Loading the mapping…</p>
      ) : (
        <JsonEditor
          label="Mapping"
          hint="A JSON object. { canonical: [variant, …] } for an authority map, { alias: canonical } for a state map — whichever shape the check consuming it expects."
          value={text}
          onChange={setDraft}
          error={parsed.ok ? undefined : parsed.error}
        />
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={!parsed.ok}
          onClick={() => parsed.ok && setDraft(JSON.stringify(parsed.value, null, 2))}
        >
          Format
        </Button>
        <Button
          disabled={!parsed.ok || save.isPending}
          onClick={() =>
            parsed.ok &&
            save.mutate({
              key: tableKey,
              mapping: parsed.value,
              description: descriptionValue.trim() || undefined,
            })
          }
        >
          {save.isPending ? "Saving…" : "Save new version"}
        </Button>
      </div>

      <Callout tone="neutral">
        The table is stored whole and read whole — a save replaces the previous version wholesale
        rather than merging into it.
      </Callout>
    </>
  );
}
