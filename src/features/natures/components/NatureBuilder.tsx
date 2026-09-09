"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { PluginCatalogue } from "@/lib/api/types";
import {
  readChecks,
  readExtraction,
  readExtractionRecord,
  withChecks,
  withExtraction,
  withExtractionParam,
  withFields,
  type NatureConfig,
} from "../config";
import { NatureChecksEditor } from "./NatureChecksEditor";
import { NatureFieldsEditor } from "./NatureFieldsEditor";
import { PluginParamsFields } from "./PluginParamsFields";

/**
 * The form view of a nature config.
 *
 * Reads the config, renders controls from the catalog, and hands a whole new
 * config back on every edit. It holds no state of its own: the editor above owns
 * the draft, so the form and the JSON view can never disagree about what would be
 * saved.
 *
 * Deliberately narrower than the old template builder: no integrity section, no
 * verdict-policy section. Both are common to every nature and applied
 * automatically at resolution time (LensAI-Backend's `app/pipeline/common_checks.py`)
 * — there is nothing for this form to configure about either.
 */
export function NatureBuilder({
  config,
  catalogue,
  onChange,
}: {
  config: NatureConfig;
  catalogue: PluginCatalogue;
  onChange: (config: NatureConfig) => void;
}) {
  const extraction = readExtraction(config);
  const extractor =
    catalogue.extractors.find((candidate) => candidate.name === extraction.plugin) ??
    catalogue.extractors[0];

  return (
    <div className="grid gap-8">
      <section className="grid gap-3">
        <Input
          label="Description"
          hint="What this document type is, for whoever manages this nature next."
          value={typeof config.description === "string" ? config.description : ""}
          onChange={(event) => onChange({ ...config, description: event.target.value })}
        />

        <Textarea
          label="Instructions for the model"
          hint="What kind of document this is and anything it should know before reading. The rules about returning exact values and never guessing are always added for you."
          rows={4}
          value={extraction.instructions ?? ""}
          onChange={(event) =>
            onChange(withExtraction(config, { instructions: event.target.value }))
          }
        />
      </section>

      <NatureFieldsEditor
        fields={extraction.fields}
        fieldTypes={catalogue.field_types}
        onChange={(fields) => onChange(withFields(config, fields))}
      />

      <NatureChecksEditor
        checks={readChecks(config)}
        fields={extraction.fields}
        plugins={catalogue.checks}
        onChange={(checks) => onChange(withChecks(config, checks))}
      />

      {extractor ? (
        <section className="grid gap-3">
          <h3 className="text-[12.5px] font-medium text-ink">How the document is read</h3>

          <Select
            label="Reader"
            hint={extractor.summary}
            value={extraction.plugin || extractor.name}
            onChange={(event) => onChange(withExtraction(config, { plugin: event.target.value }))}
          >
            {catalogue.extractors.map((candidate) => (
              <option key={candidate.name} value={candidate.name}>
                {candidate.title}
              </option>
            ))}
          </Select>

          <PluginParamsFields
            specs={extractor.params}
            values={readExtractionRecord(config)}
            onChange={(key, value) => onChange(withExtractionParam(config, key, value))}
          />
        </section>
      ) : null}
    </div>
  );
}
