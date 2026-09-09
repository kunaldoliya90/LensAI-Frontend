"use client";

import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { ParamSpec } from "@/lib/api/types";
import { paramValue } from "../config";

/**
 * One catalog parameter as one control.
 *
 * Nothing here knows which plugin it is rendering for. The backend describes each
 * param's type, label, bounds and default, and this maps that description onto an
 * existing primitive — which is what lets a check added to the backend appear in
 * the builder with correct inputs and no frontend change.
 *
 * An unset param renders empty with its default as the placeholder, so "using
 * the default" is visible rather than being indistinguishable from a value that
 * happens to equal it.
 */
export function ParamControl({
  spec,
  value,
  onChange,
}: {
  spec: ParamSpec;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const set = (raw: string | boolean | string[]) => onChange(paramValue(spec, raw));

  if (spec.type === "boolean") {
    const checked = typeof value === "boolean" ? value : spec.default === true;
    return (
      <div className="grid gap-1">
        <Checkbox
          label={spec.label}
          checked={checked}
          onChange={(event) => set(event.target.checked)}
        />
        {spec.help ? <p className="pl-6 text-[13px] text-ink-muted">{spec.help}</p> : null}
      </div>
    );
  }

  if (spec.choices.length > 0) {
    return (
      <Select
        label={spec.label}
        hint={spec.help || undefined}
        value={typeof value === "string" ? value : String(spec.default ?? "")}
        onChange={(event) => set(event.target.value)}
      >
        {spec.choices.map((choice) => (
          <option key={choice} value={choice}>
            {choice}
          </option>
        ))}
      </Select>
    );
  }

  if (spec.type === "string[]") {
    const list = Array.isArray(value) ? value : (spec.default as string[] | undefined) ?? [];
    return (
      <Textarea
        label={spec.label}
        hint={spec.help ? `${spec.help} One per line.` : "One per line."}
        mono
        rows={Math.min(8, Math.max(3, list.length + 1))}
        value={list.join("\n")}
        onChange={(event) => set(event.target.value.split("\n"))}
      />
    );
  }

  if (spec.type === "text") {
    return (
      <Textarea
        label={spec.label}
        hint={spec.help || undefined}
        rows={4}
        value={typeof value === "string" ? value : ""}
        placeholder={asPlaceholder(spec.default)}
        onChange={(event) => set(event.target.value)}
      />
    );
  }

  const numeric = spec.type === "number" || spec.type === "integer";
  return (
    <Input
      label={spec.label}
      hint={spec.help || undefined}
      type={numeric ? "number" : "text"}
      inputMode={numeric ? "decimal" : undefined}
      step={spec.type === "integer" ? 1 : "any"}
      min={spec.minimum ?? undefined}
      max={spec.maximum ?? undefined}
      value={value === undefined || value === null ? "" : String(value)}
      placeholder={asPlaceholder(spec.default)}
      onChange={(event) => set(event.target.value)}
    />
  );
}

function asPlaceholder(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  return `Default: ${String(value)}`;
}
