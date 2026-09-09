"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { API_ROOT } from "@/lib/api/config";
import { playgroundKeyStore, sessionStore } from "@/lib/auth/session";
import { useSession } from "@/lib/auth/useSession";
import { titleFor } from "../consoleNav";
import { consoleThemeStore } from "../consoleTheme";
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
  const theme = useSyncExternalStore(
    consoleThemeStore.subscribe,
    consoleThemeStore.get,
    consoleThemeStore.getServerSnapshot,
  );

  if (!session) return null;

  const logOut = () => {
    // Both credentials, and every cached answer fetched with them.
    sessionStore.clear();
    playgroundKeyStore.clear();
    queryClient.clear();
    router.replace("/login");
  };

  return (
    // data-theme is what picks the console's ground, and with it the type and
    // the radii. It sits here rather than on <html> so the marketing site keeps
    // its own dark palette, and on the outermost element so a <dialog> opened
    // anywhere inside still inherits it — the top layer changes painting order,
    // not the DOM tree properties cascade through. That block also paints the
    // page, so there is no background utility here to keep in sync with it.
    <div data-theme={theme} className="isolate min-h-dvh lg:flex">
      {/*
        The ground, moving. Three drifting colour fields, fixed to the viewport
        and painted at z-index -1 — above this wrapper's own background and
        below every in-flow child, which is why nothing else in the console
        needs a z-index. `isolate` above is what keeps that negative index
        inside the wrapper rather than sending it behind the page.

        Both grounds paint it; only the tokens differ, so Porcelain gets a tint
        you have to look for and Neon gets the violet and cyan fields the design
        puts behind its panels.
      */}
      <div aria-hidden className="console-glow">
        <span />
        <span />
        <span />
      </div>

      <ConsoleSidebar
        session={session}
        open={navOpen}
        theme={theme}
        onNavigate={() => setNavOpen(false)}
        onToggleTheme={consoleThemeStore.toggle}
        onLogOut={logOut}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-line bg-ground/70 px-4 backdrop-blur-[14px] backdrop-saturate-150 sm:px-6">
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
          <span className="hidden truncate text-[13px] text-ink lg:inline">
            {titleFor(session.role, pathname)}
          </span>

          <span className="ml-auto inline-flex shrink-0 items-center rounded-full border border-line-strong px-2.5 py-1 font-mono text-[10.5px] text-ink-subtle">
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
        <main className="stagger grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)] content-start gap-3 p-4 pb-8 sm:p-5 sm:pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}
