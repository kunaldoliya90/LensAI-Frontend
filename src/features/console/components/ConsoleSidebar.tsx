"use client";

import { LogOut, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { UserRole } from "@/lib/api/types";
import type { Session } from "@/lib/auth/session";
import { isActive, navFor, visibleItems } from "../consoleNav";

const ROLE_LABEL: Record<UserRole, string> = {
  USER: "Tenant user",
  ADMIN: "LensAI staff",
  SUPER_ADMIN: "LensAI super admin",
};

export function ConsoleSidebar({
  session,
  open,
  onNavigate,
  onLogOut,
}: {
  session: Session;
  open: boolean;
  onNavigate: () => void;
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
      <Link href="/app" className="hidden h-14 items-center gap-2.5 border-b border-line px-5 lg:flex">
        <span aria-hidden className="grid size-7 place-items-center rounded-md bg-accent text-btn-fg">
          <Search className="size-4" strokeWidth={1.8} />
        </span>
        <span className="leading-tight">
          <b className="block text-[15px] font-semibold tracking-[-0.01em] text-ink">LensAI</b>
          <small className="block text-[11.5px] text-ink-subtle">Compliance intelligence</small>
        </span>
      </Link>

      <nav
        aria-label="Console"
        className="grid grid-cols-[minmax(0,1fr)] content-start gap-5 overflow-y-auto px-3 py-4"
      >
        {groups.map((group) => (
          <div key={group.heading}>
            <p className="px-2.5 pb-1.5 text-[11px] font-semibold tracking-[0.08em] text-ink-subtle uppercase">
              {group.heading}
            </p>
            <ul className="grid gap-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href, pathname);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block rounded-md px-2.5 py-2 text-[13.5px] font-medium transition-colors",
                        active
                          ? "bg-accent-soft text-accent"
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

      {/* The identity block: on a shared account the question it answers is
          "whose session is this". */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-2.5 border-t border-line p-3">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent"
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
