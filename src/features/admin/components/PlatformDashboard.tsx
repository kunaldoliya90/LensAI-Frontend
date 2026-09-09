"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, Building2, ClipboardCheck, FileJson, ShieldCheck, UserCog } from "lucide-react";
import Link from "next/link";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Callout } from "@/components/ui/Callout";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { hasPermission } from "@/lib/auth/session";
import { useSession } from "@/lib/auth/useSession";
import { CountUp } from "@/components/ui/CountUp";
import { currentMonthRange, formatInteger } from "@/lib/format";
import { getPlatformUsage } from "@/features/usage/api/usage";
import { listKeysByStatus, listTenants } from "../api/admin";

const TOOLS = [
  {
    href: "/staff/clients",
    label: "Clients",
    body: "Every client across every tenant, to help set one up or investigate it.",
    permission: "tenants" as const,
  },
  {
    href: "/staff/tenants",
    label: "Tenants",
    body: "Suspend or reactivate an account. Suspension blocks every API call for that tenant.",
    permission: "tenants" as const,
  },
  {
    href: "/staff/keys",
    label: "Approval queue",
    body: "Approve or reject API keys and set the rate-limit tier that will apply to them.",
    permission: "api_keys" as const,
  },
  {
    href: "/staff/api-keys",
    label: "API keys",
    body: "Every key, any tenant, any status — revoke one at any time.",
    permission: "api_keys" as const,
  },
  {
    href: "/staff/usage",
    label: "Platform usage",
    body: "Every tenant's usage over a period, one row per tenant per provider scope.",
    permission: "usage" as const,
  },
];

export function PlatformDashboard() {
  const session = useSession();
  const month = currentMonthRange();

  const canKeys = hasPermission(session, "api_keys");
  const canTenants = hasPermission(session, "tenants");
  const canUsage = hasPermission(session, "usage");
  const superAdmin = session?.role === "SUPER_ADMIN";

  const pending = useQuery({
    queryKey: ["admin-api-keys", "PENDING", 100],
    queryFn: () => listKeysByStatus({ status: "PENDING", limit: 100 }),
    enabled: canKeys,
  });

  const tenants = useQuery({
    queryKey: ["admin-tenants", 500],
    queryFn: () => listTenants({ limit: 500 }),
    enabled: canTenants,
  });

  const usage = useQuery({
    queryKey: ["admin-usage", month.from, month.to],
    queryFn: () => getPlatformUsage(month),
    enabled: canUsage,
  });

  const pendingCount = pending.data?.length ?? 0;
  const tenantCount = tenants.data?.length ?? 0;
  const suspendedCount = tenants.data?.filter((t) => t.status === "SUSPENDED").length ?? 0;
  const verifications = usage.data?.totals?.verifications;

  return (
    <>
      <PageHeader
        title="Platform administration"
        description="LensAI staff tools. These call /admin/* and require a staff session — an API key can never reach them."
      />

      {pending.isError ? <ErrorNotice error={pending.error} /> : null}
      {tenants.isError ? <ErrorNotice error={tenants.error} /> : null}
      {usage.isError ? <ErrorNotice error={usage.error} /> : null}

      {canKeys && !pending.isPending && pendingCount > 0 ? (
        <Callout tone="warn" title={`${formatInteger(pendingCount)} key${pendingCount === 1 ? "" : "s"} awaiting approval`}>
          Until a key is approved, every call the tenant makes returns{" "}
          <code className="font-mono text-[13px]">403 api_key_pending_approval</code>.{" "}
          <Link href="/staff/keys" className="text-accent-bright underline underline-offset-2">
            Open the queue
          </Link>
          .
        </Callout>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {canKeys ? (
          <StatCard
            icon={ClipboardCheck}
            tone={pendingCount > 0 ? "warn" : "neutral"}
            label="Pending approvals"
            value={pending.isPending ? "—" : <CountUp value={pendingCount} />}
          />
        ) : null}
        {canTenants ? (
          <StatCard
            icon={Building2}
            label="Tenants"
            value={tenants.isPending ? "—" : <CountUp value={tenantCount} />}
            detail={
              suspendedCount > 0
                ? `${formatInteger(suspendedCount)} suspended`
                : "None suspended"
            }
          />
        ) : null}
        {canUsage ? (
          <StatCard
            icon={BarChart3}
            tone="info"
            label="Verifications this month"
            value={usage.isPending ? "—" : <CountUp value={verifications ?? 0} />}
            detail="Every tenant, current month"
          />
        ) : null}
        {superAdmin ? (
          <StatCard icon={ShieldCheck} label="Your role" value="Super admin" detail="End-to-end platform ownership" />
        ) : null}
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {TOOLS.filter((tool) => hasPermission(session, tool.permission)).map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="lift panel p-4"
          >
            <p className="font-medium text-ink">{tool.label}</p>
            <p className="mt-1 text-sm text-ink-muted">{tool.body}</p>
          </Link>
        ))}

        {superAdmin ? (
          <>
            <Link
              href="/staff/natures"
              className="lift panel p-4"
            >
              <p className="flex items-center gap-1.5 font-medium text-ink">
                <FileJson aria-hidden className="size-4" />
                Document types
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                Add or update a nature. It becomes available to every tenant immediately.
              </p>
            </Link>
            <Link
              href="/staff/admins"
              className="lift panel p-4"
            >
              <p className="flex items-center gap-1.5 font-medium text-ink">
                <UserCog aria-hidden className="size-4" />
                Admins
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                Create another admin and choose exactly what they can manage.
              </p>
            </Link>
          </>
        ) : null}
      </div>

      <Callout tone="neutral" title="Role and permissions are re-read on every request">
        The API reads role and granted permissions from the database per request, so a change takes
        effect on the next call rather than at the next login. This page only hides the UI.
      </Callout>
    </>
  );
}
