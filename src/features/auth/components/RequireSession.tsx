"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { sessionStore } from "@/lib/auth/session";
import { useSession } from "@/lib/auth/useSession";

/**
 * The console's gate. The token lives in sessionStorage, so this cannot run on
 * the server — there is no cookie for middleware to read.
 */
export function RequireSession({ children }: { children: ReactNode }) {
  const session = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!sessionStore.get()) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [session, pathname, router]);

  if (!session) {
    return (
      <div className="grid min-h-dvh place-items-center px-4">
        <p className="text-sm text-ink-muted">Checking your session…</p>
      </div>
    );
  }

  return <>{children}</>;
}
