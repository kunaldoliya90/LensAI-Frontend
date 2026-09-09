"use client";

import { Input } from "@/components/ui/Input";
import type { ExpectedField } from "@/lib/api/types";

/**
 * The values to compare the document against.
 *
 * Labels, types and hints come from the nature, so this renders a usable form
 * for a document type it has never heard of — which is the point, since natures
 * are added to the platform catalog after this code shipped.
 */
export function ExpectedValuesFields({
  fields,
  values,
  onChange,
}: {
  fields: ExpectedField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-medium">Expected values</legend>
      <p className="text-[13px] text-ink-muted">
        {fields.length === 0
          ? "This document type declares no comparison keys, so there is nothing to fill in."
          : "What you believe the document says. A key you leave blank is reported NOT_SPECIFIED rather than as a mismatch."}
      </p>

      {fields.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((field) => (
            <Input
              key={field.key}
              label={field.label}
              // The key is what the API receives, so it stays visible next to the
              // label an integrator will not find in the request body.
              hint={hintFor(field)}
              type={field.type === "date" ? "date" : "text"}
              inputMode={field.type === "number" ? "decimal" : undefined}
              placeholder={field.format ?? undefined}
              value={values[field.key] ?? ""}
              onChange={(event) => onChange(field.key, event.target.value)}
            />
          ))}
        </div>
      ) : null}
    </fieldset>
  );
}

function hintFor(field: ExpectedField): string {
  return [field.key, field.hint].filter(Boolean).join(" — ");
}
