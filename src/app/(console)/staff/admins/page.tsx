import { AdminsManager } from "@/features/admin/components/AdminsManager";
import { RequireAdmin } from "@/features/auth/components/RequireAdmin";

export default function StaffAdminsPage() {
  return (
    <RequireAdmin superAdminOnly>
      <AdminsManager />
    </RequireAdmin>
  );
}
