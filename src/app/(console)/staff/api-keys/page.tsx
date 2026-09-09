import { Suspense } from "react";
import { AllApiKeysManager } from "@/features/admin/components/AllApiKeysManager";
import { RequireAdmin } from "@/features/auth/components/RequireAdmin";

export default function StaffApiKeysPage() {
  return (
    <RequireAdmin permission="api_keys">
      <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
        <AllApiKeysManager />
      </Suspense>
    </RequireAdmin>
  );
}
