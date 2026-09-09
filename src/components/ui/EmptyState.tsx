import { Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="panel border-dashed border-line-strong px-6 py-10 text-center">
      <span className="mx-auto flex size-9 items-center justify-center rounded-full border border-line bg-surface-strong">
        <Icon aria-hidden className="size-[18px] text-ink-subtle" strokeWidth={1.8} />
      </span>
      <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-prose text-[13px] leading-relaxed text-ink-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center gap-2">{action}</div> : null}
    </div>
  );
}
