"use client";

import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Select } from "@/components/ui/Select";
import { SEVERITIES, type Plugin, type Severity } from "@/lib/api/types";
import { SEVERITY_LABELS, writeParam, type NatureCheck, type NatureField } from "../config";
import { BuilderRow } from "./BuilderRow";
import { PluginParamsFields } from "./PluginParamsFields";

/**
 * The comparisons that produce the verdict.
 *
 * Which checks are offered for a field comes from the catalog's `value_types`, so
 * a date field is not offered an amount comparison. That filter is the reason the
 * builder does not need to know what any individual check does.
 */
export function NatureChecksEditor({
  checks,
  fields,
  plugins,
  onChange,
}: {
  checks: NatureCheck[];
  fields: NatureField[];
  plugins: Plugin[];
  onChange: (checks: NatureCheck[]) => void;
}) {
  const replace = (index: number, check: NatureCheck) =>
    onChange(checks.map((existing, at) => (at === index ? check : existing)));

  const add = () => {
    const field = fields[0];
    const plugin = pluginsFor(plugins, field)[0] ?? plugins[0];
    if (!field || !plugin) return;
    onChange([
      ...checks,
      {
        plugin: plugin.name,
        field: field.key,
        expects: field.key,
        severity: "mandatory",
        ...(plugin.reference_data_key ? { reference_data: plugin.reference_data_key } : {}),
      },
    ]);
  };

  return (
    <section className="grid gap-3">
      <div>
        <h3 className="text-[12.5px] font-medium text-ink">What to check</h3>
        <p className="mt-0.5 text-[13px] text-ink-muted">
          Each check compares one extracted field against the value your integration says it should
          be. A mandatory check that disagrees fails the document; an advisory one is recorded but
          does not change the verdict.
        </p>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-md border border-dashed border-line-strong px-3 py-4 text-[13px] text-ink-muted">
          Add a field first — a check compares something the document was read for.
        </p>
      ) : null}

      {checks.length > 0 ? (
        <ul className="grid gap-3">
          {checks.map((check, index) => {
            const plugin = plugins.find((candidate) => candidate.name === check.plugin);
            const field = fields.find((candidate) => candidate.key === check.field);
            return (
              <BuilderRow
                key={index}
                title={`${field?.label || check.field} — ${plugin?.title ?? check.plugin}`}
                subtitle={plugin?.summary}
                removeLabel={`Remove the ${plugin?.title ?? check.plugin} check on ${check.field}`}
                onRemove={() => onChange(checks.filter((_, at) => at !== index))}
              >
                {plugin?.uses_llm ? (
                  <p>
                    <Pill tone="info">Uses the model</Pill>
                  </p>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-3">
                  <Select
                    label="Field"
                    value={check.field}
                    onChange={(event) => {
                      const key = event.target.value;
                      // `expects` follows the field unless it was pointed
                      // somewhere else deliberately.
                      const expects = check.expects === check.field ? key : check.expects;
                      replace(index, { ...check, field: key, expects });
                    }}
                  >
                    {fields.map((candidate) => (
                      <option key={candidate.key} value={candidate.key}>
                        {candidate.label || candidate.key}
                      </option>
                    ))}
                  </Select>

                  <Select
                    label="Comparison"
                    value={check.plugin}
                    onChange={(event) => {
                      const next = plugins.find((p) => p.name === event.target.value);
                      // Rebuilt rather than spread: params belong to the plugin
                      // that declared them, and carrying them onto a different
                      // comparison leaves settings that silently do nothing.
                      replace(index, {
                        plugin: event.target.value,
                        field: check.field,
                        expects: check.expects,
                        severity: check.severity,
                        ...(next?.reference_data_key
                          ? { reference_data: next.reference_data_key }
                          : {}),
                      });
                    }}
                  >
                    {pluginsFor(plugins, field).map((candidate) => (
                      <option key={candidate.name} value={candidate.name}>
                        {candidate.title}
                      </option>
                    ))}
                  </Select>

                  <Select
                    label="If it disagrees"
                    value={check.severity}
                    onChange={(event) =>
                      replace(index, { ...check, severity: event.target.value as Severity })
                    }
                  >
                    {SEVERITIES.map((severity) => (
                      <option key={severity} value={severity}>
                        {SEVERITY_LABELS[severity]}
                      </option>
                    ))}
                  </Select>
                </div>

                {plugin ? (
                  <PluginParamsFields
                    specs={plugin.params}
                    values={check.params ?? {}}
                    onChange={(key, value) =>
                      replace(index, {
                        ...check,
                        params: writeParam(check.params ?? {}, key, value),
                      })
                    }
                  />
                ) : (
                  <p className="text-[13px] text-fail">
                    This deployment has no plugin named <code className="font-mono">{check.plugin}</code>.
                  </p>
                )}
              </BuilderRow>
            );
          })}
        </ul>
      ) : null}

      <div>
        <Button variant="secondary" size="sm" disabled={fields.length === 0} onClick={add}>
          Add a check
        </Button>
      </div>
    </section>
  );
}

/** Checks whose `value_types` cover this field's type. Empty means any type. */
function pluginsFor(plugins: Plugin[], field: NatureField | undefined): Plugin[] {
  const type = field?.type ?? "string";
  const matching = plugins.filter(
    (plugin) => plugin.value_types.length === 0 || plugin.value_types.includes(type),
  );
  return matching.length > 0 ? matching : plugins;
}
