import { ArrowDownRight, ArrowRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { Tone } from "@/components/ui/Pill";
import { cn } from "@/lib/cn";
import { formatPercentChange } from "@/lib/format";

/** Trend against the equivalent earlier period. */
export interface StatDelta {
  /** Null when there is no baseline to compare against — the first month of use. */
  percent: number | null;
  caption: string;
  /**
   * Colour for the change, when the metric has an unambiguous direction. Left
   * unset the change is drawn neutrally, which is the honest default: more
   * verifications is not self-evidently good or bad, and colouring every rise
   * green teaches people to ignore the colour on the cards where it means
   * something.
   */
  tone?: Tone;
}

const ICON_CHIP: Record<Tone, string> = {
  pass: "bg-pass-soft text-pass",
  fail: "bg-fail-soft text-fail",
  warn: "bg-warn-soft text-warn",
  info: "bg-accent-soft text-accent-bright",
  neutral: "bg-surface-strong text-ink-subtle",
};

/** The figure itself carries the state on the cards where the state is the
 *  point; `info` is a category, not a condition, so it stays ink — and a figure
 *  that stays ink is the one the ground is allowed to fill with its own
 *  gradient, which is what `figure-gradient` asks for. A status figure must
 *  not take it: one flat, recognisable colour is the whole point of those. */
const VALUE_TEXT: Record<Tone, string> = {
  pass: "text-pass",
  fail: "text-fail",
  warn: "text-warn",
  info: "figure-gradient text-ink",
  neutral: "figure-gradient text-ink",
};

const DELTA_TEXT: Record<Tone, string> = {
  pass: "text-pass",
  fail: "text-fail",
  warn: "text-warn",
  info: "text-accent-bright",
  neutral: "text-ink-muted",
};

export function StatCard({
  label,
  value,
  detail,
  delta,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  delta?: StatDelta;
  icon?: LucideIcon;
  tone?: Tone;
}) {
  return (
    // Deliberately no hover lift. `lift` means "this is interactive", and a stat
    // card is not — the links inside it are.
    //
    // The amber ground appears only when the caller says the metric is actually
    // in a warn state: a permanently amber card reading zero trains people to
    // stop looking at it.
    <div className={cn("panel flex h-full flex-col p-3.5", tone === "warn" && "panel-warn")}>
      <div className="flex items-start justify-between gap-3">
        {/* A mono micro-label rather than sentence case: it is a column heading
            for the figure under it, not a sentence to read. */}
        <p className="font-mono text-[9.5px] tracking-[0.1em] text-ink-subtle uppercase">{label}</p>
        {Icon ? (
          <span
            className={cn("grid size-7 shrink-0 place-items-center rounded-md", ICON_CHIP[tone])}
          >
            <Icon aria-hidden className="size-3.5" strokeWidth={1.9} />
          </span>
        ) : null}
      </div>

      {/* Figure and change share one baseline. The comparison is what makes the
          figure mean anything, so it is not pushed onto its own line. */}
      <p className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span
          className={cn(
            // The size AND the face come from .figure: both are the ground's to
            // set, and a utility here would win over the class — `font-mono`
            // used to sit in this list and it was putting Geist Mono's slashed
            // zero back into every headline figure.
            "figure leading-none tracking-[-0.02em]",
            VALUE_TEXT[tone],
          )}
        >
          {value}
        </span>
        {delta && delta.percent !== null ? (
          <Change percent={delta.percent} tone={delta.tone} />
        ) : null}
      </p>

      {/* mt-auto, so the caption sits on the card's floor rather than under
          the figure with the leftover height below it. A card in a row of four
          is as tall as the tallest of them whatever it contains, so the only
          question is whether that height reads as spacing or as a gap. */}
      {delta ? (
        <p className="mt-auto pt-2.5 text-[11.5px] text-ink-subtle">
          {delta.percent === null ? `No ${delta.caption} to compare against` : delta.caption}
        </p>
      ) : null}
      {detail ? (
        <div className={cn("text-[11.5px] text-ink-muted", delta ? "mt-1.5" : "mt-auto pt-2.5")}>
          {detail}
        </div>
      ) : null}
    </div>
  );
}

function Change({ percent, tone = "neutral" }: { percent: number; tone?: Tone }) {
  const rounded = Math.round(percent);
  const Arrow = rounded > 0 ? ArrowUpRight : rounded < 0 ? ArrowDownRight : ArrowRight;

  return (
    <span
      className={cn("inline-flex items-center gap-0.5 text-[11.5px] font-medium", DELTA_TEXT[tone])}
    >
      <Arrow aria-hidden className="size-3.5" strokeWidth={2.2} />
      {formatPercentChange(percent)}
    </span>
  );
}
