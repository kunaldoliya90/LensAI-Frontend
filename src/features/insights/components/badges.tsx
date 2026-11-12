import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/cn";
import type { Criticality } from "@/lib/api/types";

const LABEL: Record<Criticality, string> = { HIGH: "High", MEDIUM: "Medium", LOW: "Low" };
const INK: Record<Criticality, string> = {
  HIGH: "text-fail",
  MEDIUM: "text-warn",
  LOW: "text-ink-muted before:bg-ink-subtle",
};

/** Outlined rather than filled, so criticality never competes with a red flag. */
export function CriticalityPill({ value }: { value: Criticality | null | undefined }) {
  if (!value) return <span className="text-ink-subtle">—</span>;
  return (
    <Pill className={cn("border-line-strong bg-transparent", INK[value])}>{LABEL[value]}</Pill>
  );
}
