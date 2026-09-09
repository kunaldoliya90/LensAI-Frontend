"use client";

import { useQuery } from "@tanstack/react-query";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Pill } from "@/components/ui/Pill";
import { PageHeader } from "@/components/ui/PageHeader";
import { listNatures } from "../api/natures";

/**
 * What you can submit against — read only. LensAI curates this list; you pick
 * a name and send documents against it, the same way you'd tell Compliance
 * "this is a challan" rather than building the checks for one yourself.
 *
 * Nothing here is editable: adding a document type is a LensAI console action
 * on the platform's shared catalog, not tenant configuration.
 */
export function DocumentTypes() {
  const natures = useQuery({ queryKey: ["natures"], queryFn: listNatures });

  const sorted = [...(natures.data ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <PageHeader
        title="Document types"
        description="What LensAI can verify today. Pass the name shown here as `nature` when you submit a verification — see GET /v1/natures."
      />

      {natures.isError ? <ErrorNotice error={natures.error} /> : null}

      {!natures.isPending && sorted.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Nothing is available to submit against yet. Ask a LensAI administrator to add one.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {sorted.map((nature) => (
          <section key={nature.name} className="panel p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-ink">{nature.label}</p>
                <code className="text-[12px] text-ink-muted">nature: &quot;{nature.name}&quot;</code>
              </div>
              <Pill tone="neutral">v{nature.version}</Pill>
            </div>

            {nature.fields.length > 0 ? (
              <dl className="mt-3 grid gap-1.5">
                {nature.fields.map((field) => (
                  <div key={field.key} className="flex items-baseline justify-between gap-3 text-[13px]">
                    <dt className="text-ink-muted">{field.label}</dt>
                    <dd className="font-mono text-[12px] text-ink">{field.key}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-3 text-[13px] text-ink-muted">
                No fields are compared for this type — it still runs the common integrity checks
                (blank page, tampering, metadata) on every document.
              </p>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
