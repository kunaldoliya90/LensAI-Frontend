import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

/**
 * One removable entry in a builder list — a field, a check, an integrity rule.
 *
 * Exists because all three lists are the same interaction (a titled card you can
 * delete) and a reader should not have to check whether they behave the same. The
 * body is `children` rather than props so each list keeps its own controls.
 */
export function BuilderRow({
  title,
  subtitle,
  onRemove,
  removeLabel,
  children,
}: {
  title: string;
  subtitle?: string;
  onRemove: () => void;
  removeLabel: string;
  children: ReactNode;
}) {
  return (
    <li className="panel p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{title}</p>
          {subtitle ? <p className="mt-0.5 text-[13px] text-ink-muted">{subtitle}</p> : null}
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove} aria-label={removeLabel}>
          Remove
        </Button>
      </div>
      <div className="mt-3 grid gap-3">{children}</div>
    </li>
  );
}
