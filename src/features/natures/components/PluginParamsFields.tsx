"use client";

import type { ParamSpec } from "@/lib/api/types";
import { readParam } from "../config";
import { ParamControl } from "./ParamControl";

/**
 * Every parameter of one plugin, with the ones marked `advanced` folded away.
 *
 * The split comes from the catalog rather than from a list here: which knobs a
 * first-time author should see is a property of the plugin, and the backend is
 * the only place that knows it.
 */
export function PluginParamsFields({
  specs,
  values,
  onChange,
}: {
  specs: ParamSpec[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  const basic = specs.filter((spec) => !spec.advanced);
  const advanced = specs.filter((spec) => spec.advanced);

  if (specs.length === 0) {
    return <p className="text-[13px] text-ink-muted">This plugin has nothing to configure.</p>;
  }

  return (
    <div className="grid gap-3">
      {basic.map((spec) => (
        <ParamControl
          key={spec.key}
          spec={spec}
          value={readParam(values, spec.key)}
          onChange={(value) => onChange(spec.key, value)}
        />
      ))}

      {advanced.length > 0 ? (
        <details className="rounded-md border border-line bg-surface px-3 py-2">
          <summary className="cursor-pointer text-[13px] font-medium text-ink">
            Advanced ({advanced.length})
          </summary>
          <div className="mt-3 grid gap-3">
            {advanced.map((spec) => (
              <ParamControl
                key={spec.key}
                spec={spec}
                value={readParam(values, spec.key)}
                onChange={(value) => onChange(spec.key, value)}
              />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
