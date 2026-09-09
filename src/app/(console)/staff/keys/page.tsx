import { Suspense } from "react";
import { ApprovalQueue } from "@/features/admin/components/ApprovalQueue";
import { RequireAdmin } from "@/features/auth/components/RequireAdmin";

export default function StaffKeysPage() {
  return (
    <RequireAdmin permission="api_keys">
      <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
        <ApprovalQueue />
      </Suspense>
    </RequireAdmin>
  );
}
