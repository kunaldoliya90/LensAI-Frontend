"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { JsonEditor } from "@/components/ui/JsonEditor";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { getPluginCatalogue } from "@/features/natures/api/natures";
import { NatureBuilder } from "@/features/natures/components/NatureBuilder";
import { NatureValidationReport } from "@/features/natures/components/NatureValidationReport";
import { NatureVersionsTable } from "@/features/natures/components/NatureVersionsTable";
import { blankConfig, type NatureConfig } from "@/features/natures/config";
import { useUrlParams } from "@/hooks/useUrlParams";
import { parseJsonObject } from "@/lib/json";
import { createNature, listNatures, saveNature, setNatureStatus, validateNature } from "../api/admin";

// UX only, not a security boundary — SUPER_ADMIN already has full trust over
// this endpoint's `config` body, so the backend does not re-enforce a key
// shape either. This just keeps the console's own key field predictable
// (no spaces, no punctuation to URL-encode in `PUT /admin/natures/{key}`).
const KEY_PATTERN = /^[a-z0-9][a-z0-9_-]{0,99}$/;

/**
 * The platform-wide document type catalog. SUPER_ADMIN only — a nature
 * affects every tenant the moment it is activated, so there is no tenant
 * picker here the way there was for a tenant's own template: there is
 * exactly one "challan", shared by everyone.
 */
export function NaturesManager() {
  const queryClient = useQueryClient();
  const { params, setParams } = useUrlParams();
  const key = params.get("nature") ?? "";
  const view = params.get("view") === "json" ? "json" : "form";

  const [draft, setDraft] = useState<string | null>(null);
  const [activate, setActivate] = useState(true);
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const natures = useQuery({ queryKey: ["admin-natures"], queryFn: listNatures });
  const catalogue = useQuery({
    queryKey: ["plugin-catalogue"],
    queryFn: getPluginCatalogue,
    staleTime: Infinity,
  });

  const keys = [...new Set((natures.data ?? []).map((n) => n.key))].sort();
  const versions = (natures.data ?? [])
    .filter((n) => n.key === key)
    .sort((a, b) => b.version - a.version);
  const latest = versions[0];

  const starting = latest
    ? latest.config
    : blankConfig(key, catalogue.data?.extractors[0]?.name ?? "");
  const text = draft ?? JSON.stringify(starting, null, 2);
  const parsed = parseJsonObject(text);

  const validation = useMutation({ mutationFn: validateNature });

  const create = useMutation({
    mutationFn: createNature,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-natures"] });
      setParams({ nature: result.key });
      setNewKey("");
      setNewLabel("");
    },
  });

  const save = useMutation({
    mutationFn: saveNature,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-natures"] });
      setDraft(null);
      validation.reset();
    },
  });

  const status = useMutation({
    mutationFn: setNatureStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-natures"] }),
  });

  const write = (config: NatureConfig) => setDraft(JSON.stringify(config, null, 2));
  const invalidNewKey = newKey !== "" && !KEY_PATTERN.test(newKey);

  return (
    <>
      <PageHeader
        title="Document types"
        description="The shared catalog every tenant submits against. Adding one here makes it available to every account immediately — no per-tenant setup, nothing to deploy."
      />

      <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
        <Select
          label="Existing nature"
          value={key}
          onChange={(event) => setParams({ nature: event.target.value || null })}
        >
          <option value="">Select one</option>
          {keys.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
      </div>

      {natures.isError ? <ErrorNotice error={natures.error} /> : null}

      <div className="flex max-w-2xl flex-wrap items-end gap-3">
        <div className="min-w-40 flex-1">
          <Input
            label="Or add a new nature — key"
            mono
            placeholder="pan"
            hint="Lowercase letters, digits, hyphen and underscore. This is the value integrators pass as `nature`."
            error={invalidNewKey ? "Use lowercase letters, digits, hyphen or underscore." : undefined}
            value={newKey}
            onChange={(event) => setNewKey(event.target.value.trim())}
          />
        </div>
        <div className="min-w-40 flex-1">
          <Input
            label="Label"
            placeholder="PAN Card"
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
          />
        </div>
        <Button
          variant="secondary"
          disabled={newKey === "" || invalidNewKey || newLabel === "" || create.isPending}
          onClick={() =>
            create.mutate({
              key: newKey,
              label: newLabel,
              config: blankConfig(newKey, catalogue.data?.extractors[0]?.name ?? ""),
              activate: false,
            })
          }
        >
          {create.isPending ? "Creating…" : "Start"}
        </Button>
      </div>
      {create.isError ? <ErrorNotice error={create.error} title="Could not create the nature" /> : null}

      {key === "" ? (
        <Callout tone="neutral">Select a nature to edit, or add a new one above.</Callout>
      ) : (
        <>
          {catalogue.isError ? (
            <ErrorNotice error={catalogue.error} title="Could not load the available checks" />
          ) : null}
          {save.isError ? <ErrorNotice error={save.error} title="Could not save the nature" /> : null}
          {status.isError ? (
            <ErrorNotice error={status.error} title="Could not change the status" />
          ) : null}
          {validation.isError ? (
            <ErrorNotice error={validation.error} title="Could not validate" />
          ) : null}
          {validation.data ? <NatureValidationReport result={validation.data} /> : null}

          {save.isSuccess ? (
            <Callout tone="pass" title={`Saved as v${save.data.version}`}>
              {save.data.status === "ACTIVE"
                ? "This version is now the one every tenant's submissions resolve."
                : "Stored as a DRAFT. Submissions will not resolve it until it is activated."}
            </Callout>
          ) : null}

          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1 rounded-md border border-line-strong p-0.5">
                <Button
                  variant={view === "form" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setParams({ view: null })}
                >
                  Editor
                </Button>
                <Button
                  variant={view === "json" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setParams({ view: "json" })}
                >
                  JSON
                </Button>
              </div>

              {draft !== null ? (
                <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>
                  Discard changes
                </Button>
              ) : null}
            </div>

            {natures.isPending || catalogue.isPending ? (
              <p className="text-sm text-ink-muted">Loading…</p>
            ) : view === "json" ? (
              <JsonEditor
                label="Nature config"
                hint="Extraction and checks only — common integrity checks apply automatically and are never part of this."
                value={text}
                onChange={setDraft}
                error={parsed.ok ? undefined : parsed.error}
              />
            ) : !parsed.ok ? (
              <Callout tone="fail" title="The JSON cannot be parsed">
                Fix it in the JSON view, or discard your changes.
              </Callout>
            ) : catalogue.data ? (
              <NatureBuilder config={parsed.value} catalogue={catalogue.data} onChange={write} />
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                disabled={!parsed.ok || validation.isPending}
                onClick={() => parsed.ok && validation.mutate(parsed.value)}
              >
                {validation.isPending ? "Checking…" : "Check"}
              </Button>

              <Button
                disabled={!parsed.ok || save.isPending}
                onClick={() => parsed.ok && save.mutate({ key, config: parsed.value, activate })}
              >
                {save.isPending ? "Saving…" : "Save new version"}
              </Button>

              <Checkbox
                label="Activate on save"
                checked={activate}
                onChange={(event) => setActivate(event.target.checked)}
              />
            </div>

            <div>
              <h2 className="mb-2 text-[12.5px] font-medium">Versions of {key}</h2>
              <NatureVersionsTable
                versions={versions}
                loading={natures.isPending}
                showName={false}
                pendingVersion={status.isPending ? status.variables.version : null}
                onStatusChange={(version, next) => status.mutate({ key, version, status: next })}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
