import { RequireAdmin } from "@/features/auth/components/RequireAdmin";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <RequireAdmin>{children}</RequireAdmin>;
}
