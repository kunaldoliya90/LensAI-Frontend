"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

// A ref callback defined once, so it attaches once. `showModal` is what gives
// the dialog its focus trap, its inert background and its ESC handling — none
// of which are worth reimplementing.
const openDialog = (element: HTMLDialogElement | null) => {
  if (element && !element.open) element.showModal();
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  dismissible = true,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** False while the user still has to acknowledge something — a shown-once secret. */
  dismissible?: boolean;
  className?: string;
}) {
  const titleId = useId();

  if (!open) return null;

  return (
    <dialog
      ref={openDialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Let React unmount the dialog rather than the browser closing it
        // behind React's back, which would leave `open` true.
        event.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "w-[min(38rem,92vw)] rounded-xl border border-line bg-ground p-0 text-ink shadow-lg",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
        </div>
        {dismissible ? (
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close dialog">
            Close
          </Button>
        ) : null}
      </div>

      {children ? <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div> : null}

      {footer ? (
        <div className="flex flex-wrap justify-end gap-2 border-t border-line bg-surface px-5 py-3">
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}
