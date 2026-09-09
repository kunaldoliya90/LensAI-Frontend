import { TenantStatusManager } from "@/features/admin/components/TenantStatusManager";
import { RequireAdmin } from "@/features/auth/components/RequireAdmin";

export default function StaffTenantsPage() {
  return (
    <RequireAdmin permission="tenants">
      <TenantStatusManager />
    </RequireAdmin>
  );
}
