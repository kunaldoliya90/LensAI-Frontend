"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { FieldType } from "@/lib/api/types";
import { keyFromLabel, readParam, writeParam, type NatureField } from "../config";
import { BuilderRow } from "./BuilderRow";
import { ParamControl } from "./ParamControl";

/**
 * The list of values to pull out of the document.
 *
 * This is the part of a template that has no default worth offering: the fields
 * *are* the document type. Checks hang off the keys defined here, so removing or
 * renaming a field has to be reflected in them — `withFields` does that, and this
 * component only reports the new field list.
 */
export function NatureFieldsEditor({
  fields,
  fieldTypes,
  onChange,
}: {
  fields: NatureField[];
  fieldTypes: FieldType[];
  onChange: (fields: NatureField[]) => void;
}) {
  const replace = (index: number, field: NatureField) =>
    onChange(fields.map((existing, at) => (at === index ? field : existing)));

  const add = () =>
    onChange([...fields, { key: "", label: "", type: fieldTypes[0]?.key ?? "string" }]);

  return (
    <section className="grid gap-3">
      <div>
        <h3 className="text-[12.5px] font-medium text-ink">What to extract</h3>
        <p className="mt-0.5 text-[13px] text-ink-muted">
          Each field becomes one value the model reads out of the document, and one key your
          integration can compare against.
        </p>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-md border border-dashed border-line-strong px-3 py-4 text-[13px] text-ink-muted">
          No fields yet. A template must extract at least one value.
        </p>
      ) : (
        <ul className="grid gap-3">
          {fields.map((field, index) => {
            const type = fieldTypes.find((candidate) => candidate.key === field.type);
            return (
              <BuilderRow
                key={index}
                title={field.label || field.key || `Field ${index + 1}`}
                subtitle={type?.summary}
                removeLabel={`Remove ${field.label || field.key || "field"}`}
                onRemove={() => onChange(fields.filter((_, at) => at !== index))}
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input
                    label="Label"
                    placeholder="Challan Amount"
                    hint="What a person calls this value."
                    value={field.label ?? ""}
                    onChange={(event) => {
                      const label = event.target.value;
                      // The key follows the label only while the author has not
                      // set one. Renaming a label later must not silently change
                      // the key an integrator is already sending.
                      const key =
                        !field.key || field.key === keyFromLabel(field.label ?? "")
                          ? keyFromLabel(label)
                          : field.key;
                      replace(index, { ...field, label, key });
                    }}
                  />
                  <Input
                    label="Key"
                    mono
                    hint="Used in the API."
                    value={field.key}
                    onChange={(event) => replace(index, { ...field, key: event.target.value })}
                  />
                  <Select
                    label="Type"
                    value={field.type ?? "string"}
                    onChange={(event) => replace(index, { ...field, type: event.target.value })}
                  >
                    {fieldTypes.map((candidate) => (
                      <option key={candidate.key} value={candidate.key}>
                        {candidate.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <Input
                  label="Hint for the model"
                  hint="Where on the document to look, or how to tell it from a similar value."
                  value={field.hint ?? ""}
                  onChange={(event) => replace(index, { ...field, hint: event.target.value })}
                />

                {type && type.options.length > 0 ? (
                  <details className="rounded-md border border-line bg-surface px-3 py-2">
                    <summary className="cursor-pointer text-[13px] font-medium text-ink">
                      How to read this {type.label.toLowerCase()}
                    </summary>
                    <div className="mt-3 grid gap-3">
                      {type.options.map((spec) => (
                        <ParamControl
                          key={spec.key}
                          spec={spec}
                          value={readParam(field, spec.key)}
                          onChange={(value) =>
                            // `key` is reasserted because writeParam returns an
                            // open record; a field option is never named "key",
                            // so nothing is being overwritten here.
                            replace(index, { ...writeParam(field, spec.key, value), key: field.key })
                          }
                        />
                      ))}
                    </div>
                  </details>
                ) : null}
              </BuilderRow>
            );
          })}
        </ul>
      )}

      <div>
        <Button variant="secondary" size="sm" onClick={add}>
          Add a field
        </Button>
      </div>
    </section>
  );
}
