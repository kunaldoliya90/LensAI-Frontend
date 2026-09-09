"use client";

import { useQuery } from "@tanstack/react-query";
import { ErrorNotice } from "@/components/ErrorNotice";
import { PageHeader } from "@/components/ui/PageHeader";
import { dateParam, useUrlParams } from "@/hooks/useUrlParams";
import { currentMonthRange, formatDate } from "@/lib/format";
import { getTenantUsage } from "../api/usage";
import { UsageRangeFilters } from "./UsageRangeFilters";
import { UsageScopeSummary } from "./UsageScopeSummary";
import { VerificationsChart } from "./VerificationsChart";
import { UsageTable } from "./UsageTable";

export function TenantUsage() {
  const { params, setParams } = useUrlParams();
  const defaults = currentMonthRange();

  const from = dateParam(params.get("from"), defaults.from);
  const to = dateParam(params.get("to"), defaults.to);
  const byTemplate = params.get("by_template") !== "false";

  const usage = useQuery({
    queryKey: ["usage", from, to, byTemplate],
    queryFn: () => getTenantUsage({ from, to, byTemplate }),
  });

  return (
    <>
      <PageHeader
        title="Usage"
        description={
          usage.data
            ? `${formatDate(usage.data.period_start)} to ${formatDate(usage.data.period_end)}.`
            : "Defaults to the current month."
        }
      />

      <UsageRangeFilters from={from} to={to} byTemplate={byTemplate} onChange={setParams} />

      {usage.isError ? <ErrorNotice error={usage.error} /> : null}

      <VerificationsChart lines={usage.data?.lines ?? []} loading={usage.isPending} />

      <UsageScopeSummary lines={usage.data?.lines ?? []} />

      <UsageTable lines={usage.data?.lines ?? []} loading={usage.isPending} />
    </>
  );
}
