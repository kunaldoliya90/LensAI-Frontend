import { Suspense } from "react";
import { Usage } from "@/features/insights/components/Usage";

export default function UsagePage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
      <Usage />
    </Suspense>
  );
}
