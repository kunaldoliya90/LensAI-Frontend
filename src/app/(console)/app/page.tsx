import { Suspense } from "react";
import { Overview } from "@/features/insights/components/Overview";

export default function OverviewPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
      <Overview />
    </Suspense>
  );
}
