"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { API_ROOT } from "@/lib/api/config";
import { playgroundKeyStore, sessionStore } from "@/lib/auth/session";
import { useSession } from "@/lib/auth/useSession";
import { titleFor } from "../consoleNav";
import { ConsoleSidebar } from "./ConsoleSidebar";

/** Which API this build talks to. The one fact about the environment worth
 *  carrying on every page — a result that looks wrong is usually a console
 *  pointed somewhere unexpected. */
const API_HOST = new URL(API_ROOT).host;

export function ConsoleShell({ children }: { children: ReactNode }) {
  const session = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [navOpen, setNavOpen] = useState(false);

  if (!session) return null;

  const logOut = () => {
    // Both credentials, and every cached answer fetched with them.
    sessionStore.clear();
    playgroundKeyStore.clear();
    queryClient.clear();
    router.replace("/login");
  };

  return (
    // data-theme picks the console's ground — tokens, type and radii. It sits
    // here rather than on <html> so the marketing site keeps its own palette,
    // and on the outermost element so a <dialog> opened anywhere inside still
    // inherits it. That block also paints the page.
    <div data-theme="enterprise" className="min-h-dvh lg:flex">
      <ConsoleSidebar
        session={session}
        open={navOpen}
        onNavigate={() => setNavOpen(false)}
        onLogOut={logOut}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-line bg-ground px-4 sm:px-6">
          <Button
            variant="secondary"
            size="sm"
            className="lg:hidden"
            aria-expanded={navOpen}
            onClick={() => setNavOpen((open) => !open)}
          >
            <Menu aria-hidden className="size-4" />
            Menu
          </Button>
          <span className="lg:hidden">
            <Logo href="/app" variant="console" />
          </span>

          {/* The crumb names the page from the same table the rail renders, so a
              section cannot be called one thing in the nav and another here. */}
          <span className="hidden truncate text-[13.5px] font-medium text-ink lg:inline">
            {titleFor(session.role, pathname)}
          </span>

          <span className="ml-auto inline-flex shrink-0 items-center rounded-md border border-line-strong px-2.5 py-1 font-mono text-[11px] text-ink-subtle">
            {API_HOST}
          </span>
        </header>

        {/*
          content-start, not the grid default of stretch: without it every block
          on a short page inflates to fill the viewport and the console reads as
          mostly empty boxes.

          The explicit minmax(0,1fr) column matters just as much — an implicit
          grid column sizes to its widest child, so one min-w-[64rem] table was
          stretching the whole page and scrolling the document sideways on a
          phone instead of scrolling inside its own container.
        */}
        <main className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)] content-start gap-4 p-4 pb-14 sm:p-5 sm:pb-14">
          {children}
        </main>
      </div>
    </div>
  );
}
