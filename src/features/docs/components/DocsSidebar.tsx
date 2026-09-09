"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { DOCS_SECTIONS } from "../docsNav";

export function DocsSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="lg:w-56 lg:shrink-0">
      <button
        type="button"
        onClick={() => setMobileOpen((open) => !open)}
        aria-expanded={mobileOpen}
        className="mb-3 w-full rounded-md border border-line-strong px-3 py-2 text-left text-sm font-medium lg:hidden"
      >
        Documentation menu
      </button>

      <nav
        aria-label="Documentation"
        className={cn(
          "grid gap-6 lg:sticky lg:top-20 lg:block lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto",
          mobileOpen ? "grid" : "hidden",
        )}
      >
        {DOCS_SECTIONS.map((section) => (
          <div key={section.heading} className="lg:mb-6">
            <p className="text-[11px] font-semibold tracking-wide text-ink-subtle uppercase">
              {section.heading}
            </p>
            <ul className="mt-2 grid gap-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className={cn(
                      "block rounded-sm py-1 text-sm text-ink-muted hover:text-ink",
                      pathname === item.href && "font-medium text-accent-bright",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
