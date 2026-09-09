import type { ReactNode } from "react";

export const CONTROL_CLASS = [
  "w-full rounded-md border border-line-strong bg-ground px-3 py-2 text-sm text-ink",
  "placeholder:text-ink-subtle",
  // The lip, and an edge that answers the pointer. Without the inset a field on
  // a pane of glass is just a darker rectangle, which on a dark ground read as a
  // hole cut in the panel rather than something to type into.
  "shadow-[var(--control-inset)] transition-[border-color,box-shadow] duration-150",
  "hover:border-ink-subtle/45",
  "disabled:cursor-not-allowed disabled:bg-surface disabled:shadow-none",
  "aria-[invalid=true]:border-fail",
].join(" ");

/**
 * Label, hint and error wired to one control by id, so every input in the app
 * is labelled and every error is announced the same way.
 */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {required ? <span className="ml-0.5 text-fail">*</span> : null}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="text-[13px] leading-snug text-ink-muted">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[13px] text-fail">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function describedBy(id: string, hint: unknown, error: unknown): string | undefined {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}
