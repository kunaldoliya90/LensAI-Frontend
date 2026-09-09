import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Tone } from "./Pill";

const TONES: Record<Tone, string> = {
  pass: "border-pass/25 bg-pass-soft",
  fail: "border-fail/25 bg-fail-soft",
  warn: "border-warn/25 bg-warn-soft",
  info: "border-accent/20 bg-accent-soft",
  neutral: "border-line bg-surface-strong",
};

const ACCENTS: Record<Tone, string> = {
  pass: "text-pass",
  fail: "text-fail",
  warn: "text-warn",
  info: "text-accent-bright",
  neutral: "text-ink-subtle",
};

const ICONS: Record<Tone, LucideIcon> = {
  pass: CircleCheck,
  fail: CircleAlert,
  warn: TriangleAlert,
  info: Info,
  neutral: Info,
};

export function Callout({
  tone = "neutral",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const Icon = ICONS[tone];

  return (
    <div className={cn("flex gap-2.5 rounded-lg border p-3.5 text-[13px]", TONES[tone], className)}>
      <Icon aria-hidden className={cn("mt-px size-4 shrink-0", ACCENTS[tone])} strokeWidth={1.9} />
      <div className="min-w-0 flex-1">
        {title ? <p className={cn("font-semibold", ACCENTS[tone])}>{title}</p> : null}
        {children ? (
          <div className={cn("leading-relaxed text-ink", title && "mt-1")}>{children}</div>
        ) : null}
      </div>
    </div>
  );
}
