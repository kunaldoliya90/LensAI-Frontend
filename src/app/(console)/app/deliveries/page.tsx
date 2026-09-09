import { Suspense } from "react";
import { Deliveries } from "@/features/deliveries/components/Deliveries";

export default function DeliveriesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
      <Deliveries />
    </Suspense>
  );
}
