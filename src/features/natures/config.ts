/**
 * Reading and rewriting a nature config.
 *
 * The builder edits the same JSON the API stores, so every function here takes a
 * config and returns a new one. Two rules hold throughout:
 *
 * **Unknown keys survive.** The backend accepts an open config and natures
 * carry sections the builder knows nothing about (`ai`, `webhook`). Every
 * update spreads the original rather than rebuilding from known fields, so
 * opening a nature in the builder and saving it cannot silently drop a section.
 *
 * **A value equal to its default is removed, not written.** The catalog's
 * defaults are the plugin's real fallbacks, so an untouched control has nothing
 * to store. Writing them out would bloat every config and, worse, freeze today's
 * default into a nature that should have followed the plugin.
 *
 * Deliberately absent: `integrity` and `verdict_policy`. Those are common to
 * every nature and applied automatically at resolution time
 * (see `LensAI-Backend/app/pipeline/common_checks.py`), never authored here.
 */

import type { ParamSpec, Severity } from "@/lib/api/types";

/**
 * Severity in the author's terms rather than the config's.
 *
 * "mandatory" describes the check; what an author is deciding is what happens to
 * the document when it fails.
 */
export const SEVERITY_LABELS: Record<Severity, string> = {
  mandatory: "Fail the document",
  advisory: "Record it only",
  disabled: "Do not run",
};

/**
 * Open by design: a field carries whichever parsing options its type declares
 * (`dayfirst`, `number_strategy`, a nested `period` block), and that list comes
 * from the catalog at runtime. Naming them here would put the frontend back in
 * the business of tracking what the backend supports.
 */
export interface NatureField {
  key: string;
  label?: string;
  type?: string;
  hint?: string;
  [option: string]: unknown;
}

export interface NatureCheck {
  plugin: string;
  field: string;
  expects: string;
  severity: Severity;
  params?: Record<string, unknown>;
  reference_data?: string;
}

export interface NatureExtraction {
  plugin: string;
  instructions?: string;
  fields: NatureField[];
}

export type NatureConfig = Record<string, unknown>;

// -- reading -----------------------------------------------------------------

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function readExtraction(config: NatureConfig): NatureExtraction {
  const extraction = asRecord(config.extraction);
  return {
    plugin: typeof extraction.plugin === "string" ? extraction.plugin : "",
    instructions: typeof extraction.instructions === "string" ? extraction.instructions : "",
    fields: asArray<NatureField>(extraction.fields).filter((field) => asRecord(field).key),
  };
}

export function readChecks(config: NatureConfig): NatureCheck[] {
  return asArray<NatureCheck>(config.checks).filter((check) => asRecord(check).plugin);
}

/** The `extraction` block as a plain record — the extractor's params live on it. */
export function readExtractionRecord(config: NatureConfig): Record<string, unknown> {
  return asRecord(config.extraction);
}

/** A dotted key reads through nested objects: `render.dpi` -> `render: { dpi }`. */
export function readParam(source: Record<string, unknown>, key: string): unknown {
  return key.split(".").reduce<unknown>((current, segment) => {
    if (current === undefined) return undefined;
    return asRecord(current)[segment];
  }, source);
}

// -- writing ----------------------------------------------------------------

/**
 * Set or clear one possibly-dotted key, returning a new object.
 *
 * `undefined` deletes, and an object left empty by that deletion is removed too
 * — otherwise clearing the only render setting would leave `"render": {}` behind
 * on every save.
 */
export function writeParam(
  source: Record<string, unknown>,
  key: string,
  value: unknown,
): Record<string, unknown> {
  const [head, ...rest] = key.split(".");

  if (rest.length === 0) {
    const next = { ...source };
    if (value === undefined) delete next[head];
    else next[head] = value;
    return next;
  }

  const child = writeParam(asRecord(source[head]), rest.join("."), value);
  const next = { ...source };
  if (Object.keys(child).length === 0) delete next[head];
  else next[head] = child;
  return next;
}

/**
 * The value to store for `spec`, or `undefined` when it should not be stored.
 *
 * Blank means "not set" rather than "empty string": a cleared numeric control
 * has to fall back to the plugin's default, not send `NaN`.
 */
export function paramValue(spec: ParamSpec, raw: string | boolean | string[]): unknown {
  if (typeof raw === "boolean") return raw === spec.default ? undefined : raw;

  if (Array.isArray(raw)) {
    const list = raw.map((entry) => entry.trim()).filter(Boolean);
    return sameList(list, spec.default) ? undefined : list;
  }

  const text = raw.trim();
  if (text === "") return undefined;

  if (spec.type === "number" || spec.type === "integer") {
    const parsed = spec.type === "integer" ? Number.parseInt(text, 10) : Number(text);
    if (!Number.isFinite(parsed)) return undefined;
    return parsed === spec.default ? undefined : parsed;
  }

  return text === spec.default ? undefined : text;
}

function sameList(list: string[], other: unknown): boolean {
  return (
    Array.isArray(other) &&
    other.length === list.length &&
    list.every((entry, index) => entry === other[index])
  );
}

export function withExtraction(
  config: NatureConfig,
  update: Partial<NatureExtraction>,
): NatureConfig {
  return { ...config, extraction: { ...asRecord(config.extraction), ...update } };
}

/** Params live on `extraction` itself rather than under a `params` key. */
export function withExtractionParam(
  config: NatureConfig,
  key: string,
  value: unknown,
): NatureConfig {
  return { ...config, extraction: writeParam(asRecord(config.extraction), key, value) };
}

export function withFields(config: NatureConfig, fields: NatureField[]): NatureConfig {
  const before = readExtraction(config).fields;
  return withChecks(withExtraction(config, { fields }), reconcileChecks(config, before, fields));
}

/**
 * Keep checks pointing at fields that still exist.
 *
 * Without this, deleting a field leaves a check referencing nothing and the save
 * is refused with a message about a field the author already removed — they have
 * to work out that the real problem is somewhere they are not looking.
 *
 * Renames are followed rather than treated as a delete, which is why this
 * compares positionally: the fields editor only ever replaces in place, appends,
 * or filters out, so a different key at the same index is the same field renamed.
 * Diffing key sets instead would read a rename as a removal and silently discard
 * the checks the author had already configured on it.
 */
function reconcileChecks(
  config: NatureConfig,
  before: NatureField[],
  after: NatureField[],
): NatureCheck[] {
  const renames = new Map<string, string>();
  before.forEach((field, index) => {
    const next = after[index];
    if (next && next.key !== field.key) renames.set(field.key, next.key);
  });

  const surviving = new Set(after.map((field) => field.key));

  return readChecks(config)
    .map((check) => {
      const renamed = renames.get(check.field);
      if (renamed === undefined) return check;
      return {
        ...check,
        field: renamed,
        // `expects` follows only when it was tracking the field name.
        expects: check.expects === check.field ? renamed : check.expects,
      };
    })
    .filter((check) => surviving.has(check.field));
}

export function withChecks(config: NatureConfig, checks: NatureCheck[]): NatureConfig {
  return { ...config, checks };
}

/**
 * The starting point for a nature that has no saved version yet.
 *
 * Deliberately near-empty rather than a copy of a worked example: an author
 * opening a new document type and finding another one's fields already in it has
 * to work out which parts were meant for them. The extractor is set because the
 * config is invalid without it and there is nothing to decide while the catalog
 * offers one; one placeholder field is set for the same reason — the backend
 * refuses to store a config with zero extraction fields — and is meant to be
 * renamed or replaced in the builder, not kept.
 */
export function blankConfig(natureKey: string, extractorName: string): NatureConfig {
  return {
    template_key: natureKey,
    description: "",
    extraction: {
      plugin: extractorName,
      instructions: "",
      fields: [{ key: "field_1", label: "Field 1", type: "string" }],
    },
    checks: [],
  };
}

/**
 * A key derived from a label: `Challan Amount` -> `challan_amount`.
 *
 * The key is what the API compares against and what an integrator sends, so it
 * is offered as a starting point and stays editable rather than being locked to
 * the label.
 */
export function keyFromLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
