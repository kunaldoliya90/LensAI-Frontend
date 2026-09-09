import { Suspense } from "react";
import { PlatformUsage } from "@/features/usage/components/PlatformUsage";
import { RequireAdmin } from "@/features/auth/components/RequireAdmin";

export default function StaffUsagePage() {
  return (
    <RequireAdmin permission="usage">
      <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
        <PlatformUsage />
      </Suspense>
    </RequireAdmin>
  );
}
