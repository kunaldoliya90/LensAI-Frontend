"use client";

import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";

export function UsageRangeFilters({
  from,
  to,
  byTemplate,
  onChange,
}: {
  from: string;
  to: string;
  /** Omitted on the platform report — /admin/usage has no by_template parameter. */
  byTemplate?: boolean;
  onChange: (updates: Record<string, string | null>) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="w-44">
        <Input
          label="From"
          type="date"
          value={from}
          onChange={(event) => onChange({ from: event.target.value })}
        />
      </div>
      <div className="w-44">
        <Input
          label="To"
          type="date"
          value={to}
          onChange={(event) => onChange({ to: event.target.value })}
        />
      </div>

      {byTemplate !== undefined ? (
        <div className="pb-2">
          <Checkbox
            label="Break down by template"
            checked={byTemplate}
            onChange={(event) => onChange({ by_template: event.target.checked ? null : "false" })}
          />
        </div>
      ) : null}
    </div>
  );
}
