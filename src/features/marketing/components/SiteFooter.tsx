import Link from "next/link";
import { Logo } from "@/components/Logo";

const GROUPS = [
  {
    heading: "Documentation",
    links: [
      { href: "/docs/quickstart", label: "Quickstart" },
      { href: "/docs/webhooks", label: "Webhooks" },
      { href: "/docs/verdicts", label: "Verdicts" },
      { href: "/docs/api-reference", label: "API reference" },
    ],
  },
  {
    heading: "Product",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/docs/byom", label: "Bring your own model" },
      { href: "/docs/errors", label: "Error catalog" },
      { href: "/about", label: "About" },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: "/signup", label: "Create an account" },
      { href: "/login", label: "Log in" },
      { href: "/app/playground", label: "Playground" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-deep text-ink">
      <div className="mx-auto grid max-w-[1120px] gap-10 px-4 py-14 sm:grid-cols-3">
        {GROUPS.map((group) => (
          <div key={group.heading}>
            <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
              {group.heading}
            </p>
            <ul className="mt-4 grid gap-2.5 text-[14px]">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-ink-muted transition-colors hover:text-viv-cyan"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-6">
          <Logo />
          <p className="max-w-2xl text-[13px] leading-relaxed text-ink-muted">
            Document verification infrastructure. Verdicts are returned to your systems; your
            documents are held only for the retention window needed to verify them.
          </p>
        </div>
      </div>
    </footer>
  );
}
