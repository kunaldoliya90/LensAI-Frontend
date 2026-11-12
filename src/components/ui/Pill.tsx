import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tone = "pass" | "fail" | "warn" | "info" | "neutral";

const TONES: Record<Tone, string> = {
  pass: "border-pass/25 bg-pass-soft text-pass",
  fail: "border-fail/25 bg-fail-soft text-fail",
  warn: "border-warn/25 bg-warn-soft text-warn",
  info: "border-accent/25 bg-accent-soft text-accent-bright",
  neutral: "border-line-strong bg-neutral-soft text-neutral",
};

/** Status is always spelled out; the tone only reinforces the word. */
export function Pill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        // A dot as well as a colour, so status is findable by shape too.
        "inline-flex h-[22px] items-center gap-1.5 rounded-sm border px-2 text-[12px] font-medium whitespace-nowrap before:size-1.5 before:rounded-full before:bg-current",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
