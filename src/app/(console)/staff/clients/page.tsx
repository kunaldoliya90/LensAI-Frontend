import { Suspense } from "react";
import { ClientsDirectory } from "@/features/admin/components/ClientsDirectory";
import { RequireAdmin } from "@/features/auth/components/RequireAdmin";

export default function StaffClientsPage() {
  return (
    <RequireAdmin permission="tenants">
      <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
        <ClientsDirectory />
      </Suspense>
    </RequireAdmin>
  );
}
