"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { Permission } from "@/lib/api/types";
import { hasPermission, isStaff, sessionStore, type Session } from "@/lib/auth/session";
import { useSession } from "@/lib/auth/useSession";

function isAllowed(
  session: Session | null,
  permission: Permission | undefined,
  superAdminOnly: boolean | undefined,
): boolean {
  if (!isStaff(session)) return false;
  if (superAdminOnly) return session?.role === "SUPER_ADMIN";
  if (permission) return hasPermission(session, permission);
  return true;
}

/**
 * Every staff-only gate, in one component rather than one per rule: any
 * staff account by default, narrowed to one granted `permission`, or to the
 * super-admin alone via `superAdminOnly`.
 *
 * The API re-reads role and permissions from the database on every request,
 * so this only hides the UI — the real check is server-side, and a demoted or
 * narrowed account gets 403 not_authorized on its next call regardless of
 * what is rendered here.
 */
export function RequireAdmin({
  permission,
  superAdminOnly,
  children,
}: {
  permission?: Permission;
  superAdminOnly?: boolean;
  children: ReactNode;
}) {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    const current = sessionStore.get();
    if (current && !isAllowed(current, permission, superAdminOnly)) {
      router.replace("/app?notice=admin-only");
    }
  }, [session, permission, superAdminOnly, router]);

  if (!isAllowed(session, permission, superAdminOnly)) return null;

  return <>{children}</>;
}
