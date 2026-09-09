import { CircleHelp, TriangleAlert, X, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

const VERDICTS: {
  value: string;
  icon: LucideIcon;
  ring: string;
  glow: string;
  text: string;
  meaning: string;
}[] = [
  {
    value: "PASS",
    icon: Check,
    ring: "border-viv-emerald/30",
    glow: "bg-viv-emerald/10",
    text: "text-viv-emerald",
    meaning: "Every mandatory check matched.",
  },
  {
    value: "FAIL",
    icon: X,
    ring: "border-viv-rose/30",
    glow: "bg-viv-rose/10",
    text: "text-viv-rose",
    meaning: "A mandatory check mismatched, or a mandatory integrity check failed.",
  },
  {
    value: "PARTIAL",
    icon: TriangleAlert,
    ring: "border-viv-amber/30",
    glow: "bg-viv-amber/10",
    text: "text-viv-amber",
    meaning: "Some checks matched; the rest could not be read.",
  },
  {
    value: "NOT_SPECIFIED",
    icon: CircleHelp,
    ring: "border-white/15",
    glow: "bg-white/[0.06]",
    text: "text-ink-muted",
    meaning: "Nothing could be verified — neither side had a value to compare.",
  },
];

export function VerdictGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {VERDICTS.map((verdict, index) => (
        <Reveal key={verdict.value} delay={index * 90}>
          <div
            className={`h-full rounded-xl border ${verdict.ring} ${verdict.glow} p-5 transition-transform duration-200 hover:-translate-y-1`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`flex size-7 items-center justify-center rounded-md border ${verdict.ring} bg-deep-2`}
              >
                <verdict.icon
                  aria-hidden
                  className={`size-4 ${verdict.text}`}
                  strokeWidth={2.4}
                />
              </span>
              <span
                className={`font-mono text-[13px] font-semibold tracking-wide ${verdict.text} uppercase`}
              >
                {verdict.value}
              </span>
            </div>
            <p className="mt-3 text-[13.5px] leading-relaxed text-ink-muted">
              {verdict.meaning}
            </p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
