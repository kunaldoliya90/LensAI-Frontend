"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/#how-it-works", label: "Product" },
  { href: "/docs", label: "Docs" },
  { href: "/about", label: "About" },
];

/** The landing page is dark; the docs are not. The nav follows whichever it sits on. */
const DEEP_ROUTES = ["/"];

export function SiteNav() {
  const pathname = usePathname();
  const deep = DEEP_ROUTES.includes(pathname);

  return (
    <header
      className={cn(
        "sticky top-0 z-20 border-b backdrop-blur-md",
        deep ? "border-white/10 bg-deep/70" : "border-line bg-ground/80",
      )}
    >
      <div className="mx-auto max-w-[1120px] px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Logo />

          <nav aria-label="Primary" className="hidden gap-7 text-[14px] sm:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-ink-muted transition-colors hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-md px-3 text-[14px] font-medium text-ink-muted transition-colors hover:text-ink"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className={
                deep
                  ? "inline-flex h-9 items-center gap-1.5 rounded-md bg-gradient-to-r from-viv-indigo to-viv-violet px-4 text-[14px] font-semibold text-white shadow-[0_8px_24px_-8px_rgb(99_102_241/0.9)] transition-transform duration-150 hover:scale-[1.03]"
                  : buttonClass({ size: "sm" })
              }
            >
              Get started
            </Link>
          </div>
        </div>

        <nav
          aria-label="Primary"
          className={cn(
            "flex gap-5 border-t py-2.5 text-[13.5px] sm:hidden",
            deep ? "border-white/10" : "border-line",
          )}
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-ink-muted"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
