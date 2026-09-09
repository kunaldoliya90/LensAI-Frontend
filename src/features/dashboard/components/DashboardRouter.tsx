"use client";

import { PlatformDashboard } from "@/features/admin/components/PlatformDashboard";
import { isStaff } from "@/lib/auth/session";
import { useSession } from "@/lib/auth/useSession";
import { Dashboard } from "./Dashboard";

/** A tenant's product dashboard and staff's management dashboard have nothing
 * in common — verification volume means nothing to an account that owns no
 * client, and the approval queue means nothing to a tenant. */
export function DashboardRouter() {
  const session = useSession();
  if (!session) return null;
  return isStaff(session) ? <PlatformDashboard /> : <Dashboard />;
}
