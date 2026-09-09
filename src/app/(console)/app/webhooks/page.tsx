import { Suspense } from "react";
import { Webhooks } from "@/features/webhooks/components/Webhooks";

export default function WebhooksPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
      <Webhooks />
    </Suspense>
  );
}
