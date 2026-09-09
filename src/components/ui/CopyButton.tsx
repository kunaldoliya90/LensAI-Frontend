"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type CopyState = "idle" | "copied" | "failed";

const LABELS: Record<CopyState, string> = {
  idle: "Copy",
  copied: "Copied",
  failed: "Copy failed",
};

export function CopyButton({
  value,
  label,
  tone = "light",
  className,
}: {
  value: string;
  /** Overrides the idle label, e.g. "Copy client ID". */
  label?: string;
  tone?: "light" | "deep";
  className?: string;
}) {
  const [state, setState] = useState<CopyState>("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      // The clipboard API is unavailable outside a secure context; say so
      // rather than looking like nothing happened.
      setState("failed");
    }
    setTimeout(() => setState("idle"), 1800);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "shrink-0 rounded-sm border px-1.5 py-0.5 text-[11px] font-medium transition-colors",
        tone === "deep"
          ? "border-white/15 text-ink-muted hover:bg-white/10 hover:text-ink"
          : "border-line-strong text-ink-muted hover:bg-surface hover:text-ink",
        state === "copied" && "border-pass/40 text-pass",
        state === "failed" && "border-fail/40 text-fail",
        className,
      )}
    >
      {state === "idle" ? (label ?? LABELS.idle) : LABELS[state]}
    </button>
  );
}
