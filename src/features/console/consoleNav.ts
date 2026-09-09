import type { Permission, UserRole } from "@/lib/api/types";
import type { Session } from "@/lib/auth/session";

export interface NavItem {
  href: string;
  label: string;
  /** Hidden unless the session holds this permission (staff nav only). */
  permission?: Permission;
  /** Hidden unless the session's role is SUPER_ADMIN. */
  superAdminOnly?: boolean;
}

export interface NavGroup {
  heading: string;
  items: NavItem[];
}

/**
 * A tenant's own console. Every section here is that tenant's product
 * configuration — nothing on this list is staff-only, and nothing on the
 * staff list below duplicates it.
 */
const USER_NAV: NavGroup[] = [
  {
    heading: "Overview",
    items: [
      { href: "/app", label: "Dashboard" },
      { href: "/app/settings", label: "Settings" },
    ],
  },
  {
    heading: "Work",
    items: [{ href: "/app/playground", label: "Playground" }],
  },
  {
    heading: "Setup",
    items: [
      { href: "/app/clients", label: "Clients" },
      { href: "/app/keys", label: "API keys" },
      { href: "/app/webhooks", label: "Webhooks" },
      { href: "/app/document-types", label: "Document types" },
      { href: "/app/reference-data", label: "Reference data" },
      { href: "/app/ai", label: "AI providers" },
    ],
  },
  {
    heading: "Operate",
    items: [
      { href: "/app/deliveries", label: "Deliveries" },
      { href: "/app/usage", label: "Usage" },
    ],
  },
];

/**
 * LensAI staff. Every item here is a management action taken on a tenant's
 * behalf, never the tenant's own product — an admin does not own clients,
 * keys or templates the way a USER does, only the ability to act on them
 * where a permission was actually granted (see `app.core.permissions` on the
 * backend, the source of truth this mirrors).
 */
const STAFF_NAV: NavGroup[] = [
  {
    heading: "Overview",
    items: [
      { href: "/app", label: "Dashboard" },
      { href: "/app/settings", label: "Settings" },
    ],
  },
  {
    heading: "Work",
    items: [{ href: "/app/playground", label: "Playground" }],
  },
  {
    heading: "Manage",
    items: [
      { href: "/staff/clients", label: "Clients", permission: "tenants" },
      { href: "/staff/tenants", label: "Tenants", permission: "tenants" },
      { href: "/staff/keys", label: "Approval queue", permission: "api_keys" },
      { href: "/staff/api-keys", label: "API keys", permission: "api_keys" },
    ],
  },
  {
    heading: "Platform",
    items: [{ href: "/staff/usage", label: "Usage", permission: "usage" }],
  },
  {
    heading: "Administration",
    items: [
      { href: "/staff/natures", label: "Document types", superAdminOnly: true },
      { href: "/staff/admins", label: "Admins", superAdminOnly: true },
    ],
  },
];

export function navFor(role: UserRole | undefined): NavGroup[] {
  return role === "USER" ? USER_NAV : STAFF_NAV;
}

export function visibleItems(group: NavGroup, session: Session | null): NavItem[] {
  return group.items.filter((item) => {
    if (item.superAdminOnly) return session?.role === "SUPER_ADMIN";
    if (item.permission) {
      return session?.role === "SUPER_ADMIN" || session?.permissions.includes(item.permission);
    }
    return true;
  });
}

/** `/app` and `/staff` are prefixes of every page below them, so they match exactly. */
export function isActive(href: string, pathname: string): boolean {
  return href === "/app" || href === "/staff" ? pathname === href : pathname.startsWith(href);
}

/**
 * The label of the page currently open, for the console header's crumb.
 *
 * Read off the same nav table the rail renders, so a page cannot end up with a
 * heading in one place and a different name in the other. Permission filtering
 * is deliberately skipped: this only names a route the user has already
 * reached, and a route they cannot reach is guarded, not hidden from its own
 * title.
 */
export function titleFor(role: UserRole | undefined, pathname: string): string {
  for (const group of navFor(role)) {
    for (const item of group.items) {
      if (isActive(item.href, pathname)) return item.label;
    }
  }
  return "Console";
}
