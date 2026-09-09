import { Suspense } from "react";
import { DashboardRouter } from "@/features/dashboard/components/DashboardRouter";

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
      <DashboardRouter />
    </Suspense>
  );
}
