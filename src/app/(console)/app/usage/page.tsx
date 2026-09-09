import { Suspense } from "react";
import { TenantUsage } from "@/features/usage/components/TenantUsage";

export default function UsagePage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
      <TenantUsage />
    </Suspense>
  );
}
