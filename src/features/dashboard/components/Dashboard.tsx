"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, FlaskConical, KeyRound, Send, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { buttonClass } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { listApiKeys } from "@/features/api-keys/api/apiKeys";
import { listClients } from "@/features/clients/api/clients";
import { getTenantUsage } from "@/features/usage/api/usage";
import { VerificationsChart } from "@/features/usage/components/VerificationsChart";
import { useUrlParams } from "@/hooks/useUrlParams";
import { useSession } from "@/lib/auth/useSession";
import { currentMonthRange, formatInteger, previousMonthRange } from "@/lib/format";
import { DashboardStats } from "./DashboardStats";
import { RecentDeliveries } from "./RecentDeliveries";

export function Dashboard() {
  const session = useSession();
  const { params } = useUrlParams();
  const month = currentMonthRange();
  const lastMonth = previousMonthRange();

  const clients = useQuery({ queryKey: ["clients"], queryFn: listClients });
  const apiKeys = useQuery({ queryKey: ["api-keys"], queryFn: listApiKeys });
  const usage = useQuery({
    queryKey: ["usage", month.from, month.to, false],
    queryFn: () => getTenantUsage({ ...month, byTemplate: false }),
  });
  // The baseline for every "vs last month" figure. A separate query rather than
  // one wide range because the report has no month dimension to split on — the
  // totals it returns cover whatever range was asked for.
  const baseline = useQuery({
    queryKey: ["usage", lastMonth.from, lastMonth.to, false],
    queryFn: () => getTenantUsage({ ...lastMonth, byTemplate: false }),
  });

  const keys = apiKeys.data ?? [];
  const activeKeys = keys.filter((key) => key.status === "ACTIVE").length;
  const pendingKeys = keys.filter((key) => key.status === "PENDING").length;
  const clientCount = clients.data?.length ?? 0;

  return (
    <>
      {/* Titled by what it shows, not by who is looking at it. The local part
          of an email address is not a name — on this account it rendered as
          "Welcome back, kunal.doliya+qa20260824-02" in 24px, which made the
          largest text on the product's front page a test address. Whose session
          this is belongs in the rail's footer, and is already there. */}
      <PageHeader
        title="This month"
        description="What your account has used since the 1st, and everything a human configures around the API. Job intake and results themselves live on the API."
      />

      {params.get("notice") === "admin-only" ? (
        <Callout tone="warn" title="Administrator only">
          That page is restricted to LensAI staff. Your session role is {session?.role}.
        </Callout>
      ) : null}

      {clients.isError ? <ErrorNotice error={clients.error} /> : null}
      {apiKeys.isError ? <ErrorNotice error={apiKeys.error} /> : null}
      {usage.isError ? <ErrorNotice error={usage.error} /> : null}

      {!clients.isPending && clientCount === 0 ? (
        <Callout tone="warn" title="Create a client first">
          <p>
            Every job and webhook hangs off a client_id. Nothing else can be configured until one
            exists.
          </p>
          <Link href="/app/clients" className={buttonClass({ size: "sm", className: "mt-2" })}>
            Create a client
          </Link>
        </Callout>
      ) : null}

      {!apiKeys.isPending && activeKeys === 0 ? (
        <Callout tone="warn" title="No key can authenticate yet">
          <p>
            {pendingKeys > 0
              ? `${pendingKeys} key${pendingKeys === 1 ? " is" : "s are"} waiting for a LensAI administrator to approve ${pendingKeys === 1 ? "it" : "them"}.`
              : "Request a key. A LensAI administrator must approve it before it authenticates."}
          </p>
          <Link href="/app/keys" className={buttonClass({ size: "sm", className: "mt-2" })}>
            Go to API keys
          </Link>
        </Callout>
      ) : null}

      <DashboardStats
        current={usage.data?.totals}
        previous={baseline.data?.totals}
        loading={usage.isPending || baseline.isPending}
      />

      {/* Chart and history carry the detail; the rail is short and glanceable, so
          it sits second on a narrow screen and beside them from `xl` up. */}
      <div className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 content-start gap-3">
          <VerificationsChart lines={usage.data?.lines ?? []} loading={usage.isPending} />
          <RecentDeliveries />
        </div>

        <div className="grid content-start gap-3">
          <section className="panel p-4">
            <h2 className="text-[12.5px] font-medium text-ink">Quick actions</h2>
            <div className="mt-3 grid gap-2">
              <Link href="/app/playground" className={buttonClass({ size: "sm" })}>
                <FlaskConical aria-hidden className="size-4" />
                Run a verification
              </Link>
              <Link
                href="/app/document-types"
                className={buttonClass({ variant: "secondary", size: "sm" })}
              >
                See what you can verify
              </Link>
              <Link
                href="/app/deliveries"
                className={buttonClass({ variant: "secondary", size: "sm" })}
              >
                <Send aria-hidden className="size-4" />
                Check webhook deliveries
              </Link>
            </div>
          </section>

          <section className="panel p-4">
            <h2 className="text-[12.5px] font-medium text-ink">Account setup</h2>
            <ul className="mt-3 grid gap-1">
              <SetupRow
                href="/app/clients"
                icon={Building2}
                label="Clients"
                value={clients.isPending ? "—" : formatInteger(clientCount)}
              />
              <SetupRow
                href="/app/keys"
                icon={KeyRound}
                label="API keys"
                value={apiKeys.isPending ? "—" : formatInteger(keys.length)}
                badge={
                  apiKeys.isPending ? null : (
                    <span className="flex flex-wrap gap-1">
                      <Pill tone={activeKeys > 0 ? "pass" : "neutral"}>{activeKeys} active</Pill>
                      {pendingKeys > 0 ? <Pill tone="warn">{pendingKeys} pending</Pill> : null}
                    </span>
                  )
                }
              />
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

function SetupRow({
  href,
  icon: Icon,
  label,
  value,
  badge,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  value: string;
  badge?: ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-surface-strong"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-surface-strong text-ink-subtle">
          <Icon aria-hidden className="size-4" strokeWidth={1.9} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] text-ink-muted">{label}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold tabular-nums text-ink">{value}</span>
            {badge}
          </span>
        </span>
      </Link>
    </li>
  );
}
