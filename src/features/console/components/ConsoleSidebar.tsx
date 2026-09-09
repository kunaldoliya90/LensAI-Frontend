"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/cn";
import type { UserRole } from "@/lib/api/types";
import type { Session } from "@/lib/auth/session";
import { isActive, navFor, visibleItems } from "../consoleNav";
import { CONSOLE_THEME_LABEL, type ConsoleTheme } from "../consoleTheme";

const ROLE_LABEL: Record<UserRole, string> = {
  USER: "Tenant user",
  ADMIN: "LensAI staff",
  SUPER_ADMIN: "LensAI super admin",
};

export function ConsoleSidebar({
  session,
  open,
  theme,
  onNavigate,
  onToggleTheme,
  onLogOut,
}: {
  session: Session;
  open: boolean;
  theme: ConsoleTheme;
  onNavigate: () => void;
  onToggleTheme: () => void;
  onLogOut: () => void;
}) {
  const pathname = usePathname();
  const groups = navFor(session.role)
    .map((group) => ({ ...group, items: visibleItems(group, session) }))
    .filter((group) => group.items.length > 0);

  return (
    // Three rows from `lg` up, so the identity block sits on the floor of a
    // full-height rail and the nav is the only part that scrolls.
    //
    // The explicit minmax(0,1fr) column is what keeps the rail's contents
    // inside the rail. An implicit grid column is sized to the max-content of
    // its items, and `truncate` on the email in the footer makes that address
    // one unbreakable word — so the track grew to ~364px, the box stayed 232px,
    // and every row in the nav plus the whole footer painted 112px past the
    // border. Same failure, and same fix, as <main> in ConsoleShell.
    <aside
      className={cn(
        "rail border-line grid-cols-[minmax(0,1fr)] lg:sticky lg:top-0 lg:h-dvh lg:w-[232px] lg:shrink-0 lg:grid-rows-[auto_minmax(0,1fr)_auto] lg:border-r",
        open ? "grid border-b" : "hidden lg:grid",
      )}
    >
      <div className="hidden h-14 items-center border-b border-line px-4 lg:flex">
        <Logo href="/app" subtitle="Console" variant="console" />
      </div>

      <nav
        aria-label="Console"
        className="grid grid-cols-[minmax(0,1fr)] content-start gap-3 overflow-y-auto p-2.5"
      >
        {groups.map((group) => (
          <div key={group.heading}>
            <p className="px-2 font-mono text-[9.5px] tracking-[0.12em] text-ink-subtle uppercase">
              {group.heading}
            </p>
            <ul className="mt-1.5 grid gap-px">
              {group.items.map((item) => {
                const active = isActive(item.href, pathname);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block rounded-md px-2.5 py-[7px] text-[13px] transition-colors",
                        active
                          ? // The active marker is a bar as well as a colour, so the
                            // current page is findable without relying on the accent
                            // being distinguishable. An inset shadow rather than a
                            // positioned span: same mark, one element, and it cannot
                            // fall outside the row's rounded corner. What the mark
                            // is beyond that bar is the ground's to say — Neon rings
                            // the row and gives it the accent's glow — so it comes
                            // from --nav-active-mark rather than being spelled out
                            // here for one palette.
                            "bg-accent-soft font-medium text-ink shadow-[var(--nav-active-mark)]"
                          : "text-ink-muted hover:bg-surface-strong hover:text-ink",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* The ground switch and the identity block, both properties of the
          console rather than of the page open inside it. On a shared account the
          question the identity answers is "whose session is this". */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-2.5 border-t border-line p-3">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-pressed={theme === "neon"}
          className="flex items-center justify-between gap-2 rounded-md border border-line-strong px-2.5 py-2 text-[12px] text-ink-muted transition-colors hover:bg-surface-strong hover:text-ink"
        >
          {/* The visible label names the ground now in use, as the design has
              it; the rest of the accessible name says what pressing does, and
              is appended rather than replacing it so the visible text stays a
              prefix of the name a voice-control user would speak. */}
          <span>{CONSOLE_THEME_LABEL[theme]}</span>
          <span className="sr-only">
            {" "}
            theme — switch to {CONSOLE_THEME_LABEL[theme === "neon" ? "porcelain" : "neon"]}
          </span>
          <span
            aria-hidden
            className="inline-flex h-[15px] w-[26px] shrink-0 items-center rounded-full bg-line-strong p-0.5"
          >
            <span
              className={cn(
                "size-[11px] rounded-full bg-accent transition-transform duration-300 ease-out-soft",
                theme === "neon" ? "translate-x-0" : "translate-x-[11px]",
              )}
            />
          </span>
        </button>

        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-strong font-mono text-[11px] text-ink-muted"
          >
            {initials(session.email)}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[12px] text-ink">{session.email}</span>
            <span className="block text-[10.5px] text-ink-subtle">{ROLE_LABEL[session.role]}</span>
          </span>
          <button
            type="button"
            onClick={onLogOut}
            aria-label="Log out"
            title="Log out"
            className="grid size-7 shrink-0 place-items-center rounded-md text-ink-subtle transition-colors hover:bg-surface-strong hover:text-ink"
          >
            <LogOut aria-hidden className="size-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

/** First two letters of the local part — the address is right beside it, so this
 *  only has to be a recognisable anchor, not an identifier. */
function initials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}
