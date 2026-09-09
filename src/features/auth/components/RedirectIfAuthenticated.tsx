"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { sessionStore } from "@/lib/auth/session";
import { useSession } from "@/lib/auth/useSession";

export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    // Read the store directly: on the very first client render the hook has
    // not yet swapped from its server snapshot, and this must not act on that.
    if (sessionStore.get()) router.replace("/app");
  }, [session, router]);

  return session ? null : <>{children}</>;
}
