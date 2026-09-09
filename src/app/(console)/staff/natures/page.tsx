import { NaturesManager } from "@/features/admin/components/NaturesManager";
import { RequireAdmin } from "@/features/auth/components/RequireAdmin";

export default function StaffNaturesPage() {
  return (
    <RequireAdmin superAdminOnly>
      <NaturesManager />
    </RequireAdmin>
  );
}
