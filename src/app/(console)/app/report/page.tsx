import { Suspense } from "react";
import { AiReport } from "@/features/insights/components/AiReport";

export default function AiReportPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
      <AiReport />
    </Suspense>
  );
}
