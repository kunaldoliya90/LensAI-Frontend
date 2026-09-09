"use client";

import { useQuery } from "@tanstack/react-query";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Callout } from "@/components/ui/Callout";
import { PageHeader } from "@/components/ui/PageHeader";
import { dateParam, useUrlParams } from "@/hooks/useUrlParams";
import { currentMonthRange, formatDate } from "@/lib/format";
import { getPlatformUsage } from "../api/usage";
import { UsageRangeFilters } from "./UsageRangeFilters";
import { UsageTable } from "./UsageTable";

export function PlatformUsage() {
  const { params, setParams } = useUrlParams();
  const defaults = currentMonthRange();

  const from = dateParam(params.get("from"), defaults.from);
  const to = dateParam(params.get("to"), defaults.to);

  const usage = useQuery({
    queryKey: ["admin-usage", from, to],
    queryFn: () => getPlatformUsage({ from, to }),
  });

  return (
    <>
      <PageHeader
        title="Platform usage"
        description={
          usage.data
            ? `Every tenant, ${formatDate(usage.data.period_start)} to ${formatDate(usage.data.period_end)}. One row per tenant per provider scope.`
            : "Every tenant, one row per provider scope. Defaults to the current month."
        }
      />

      <UsageRangeFilters from={from} to={to} onChange={setParams} />

      <Callout tone="warn" title="Do not add PLATFORM and TENANT together">
        A bring-your-own-model tenant paid their provider directly for the TENANT rows. Rolling both
        scopes into one number invoices them twice for the same inference.
      </Callout>

      {usage.isError ? <ErrorNotice error={usage.error} /> : null}

      <UsageTable lines={usage.data?.lines ?? []} loading={usage.isPending} showTenant />
    </>
  );
}
