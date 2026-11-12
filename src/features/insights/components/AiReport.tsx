"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Table, TableMessage, TableScroll, Td, Th, Tr } from "@/components/ui/Table";
import { oneOf, useUrlParams } from "@/hooks/useUrlParams";
import { isStaff } from "@/lib/auth/session";
import { useSession } from "@/lib/auth/useSession";
import { cn } from "@/lib/cn";
import { formatDate, formatInteger } from "@/lib/format";
import type { InsightReportRow } from "@/lib/api/types";
import { getReport } from "../api/insights";
import { readScope } from "../scope";
import { CriticalityPill } from "./badges";
import { FilterChips, InsightsScopeBar } from "./InsightsScopeBar";
import { ReviewSheet } from "./ReviewSheet";

const PAGE_SIZE = 12;
const FLAGS = ["all", "yes", "no"] as const;

/**
 * Every verification LensAI has seen in the scope, newest first. A row opens
 * its AI review in a side sheet; the open id is the `open` param, so a review
 * can be linked to directly.
 */
export function AiReport() {
  const session = useSession();
  const staff = isStaff(session);
  const { params, setParams } = useUrlParams();
  const scope = readScope(params, staff);
  const q = params.get("q") ?? "";
  const flag = oneOf(params.get("flag"), FLAGS, "all");
  const page = Math.max(0, Number(params.get("page")) || 0);
  const open = params.get("open");

  const report = useQuery({
    queryKey: ["insights", "report", scope, q, flag, page],
    queryFn: () => getReport(scope, { q, flag, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
  const data = report.data;
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));
  const multiClient = !scope.clientId;

  return (
    <>
      <InsightsScopeBar />

      <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-2.5 pb-1">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">AI report</h1>
          <p className="mt-1 max-w-[75ch] text-[13.5px] text-ink-muted">
            Every compliance LensAI has checked. Open a row to see its AI red-flag review.
          </p>
        </div>
        <FilterChips />
      </div>

      <section className="panel min-w-0 p-5">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5">
          <label className="flex h-[34px] max-w-[380px] min-w-0 flex-[1_1_260px] items-center gap-2 rounded-md border border-line-strong bg-ground px-2.5 shadow-xs focus-within:border-accent focus-within:ring-3 focus-within:ring-accent-soft">
            <Search aria-hidden className="size-[15px] shrink-0 text-ink-subtle" />
            <span className="sr-only">Search compliance ID or title</span>
            <input
              type="search"
              defaultValue={q}
              placeholder="Search compliance ID or title"
              autoComplete="off"
              onChange={(e) => setParams({ q: e.target.value || null, page: null })}
              className="w-full min-w-0 border-0 bg-transparent font-mono text-[13px] outline-none"
            />
          </label>
          <div role="group" aria-label="Red flag status" className="inline-flex overflow-hidden rounded-md border border-line-strong shadow-xs">
            {(
              [
                ["all", `All · ${formatInteger(data?.counts.all ?? 0)}`],
                ["yes", `Red flag · ${formatInteger(data?.counts.red_flagged ?? 0)}`],
                ["no", `Clean · ${formatInteger(data?.counts.clean ?? 0)}`],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={flag === value}
                onClick={() => setParams({ flag: value === "all" ? null : value, page: null })}
                className={cn(
                  "h-8 border-r border-line-strong px-3 text-[13px] font-medium text-ink-muted last:border-r-0 hover:bg-surface-strong",
                  flag === value && "bg-deep-2 text-ink shadow-[inset_0_-2px_0_var(--color-accent)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {report.error ? <ErrorNotice error={report.error} /> : null}

        <TableScroll className="rounded-md shadow-none">
          <Table>
            <thead>
              <tr>
                <Th>Compliance ID</Th>
                <Th>Submission date</Th>
                <Th>Compliance</Th>
                {multiClient ? <Th>Client</Th> : null}
                <Th>Criticality</Th>
                <Th>Red flag</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {report.isPending ? (
                <TableMessage columns={7}>Loading…</TableMessage>
              ) : data && data.items.length === 0 ? (
                <TableMessage columns={7}>
                  {q ? `No compliance matches “${q}” in this scope.` : "Nothing checked in this scope yet."}
                </TableMessage>
              ) : (
                data?.items.map((row) => (
                  <Tr
                    key={row.verification_id}
                    tabIndex={0}
                    className="cursor-pointer align-top"
                    onDoubleClick={() => setParams({ open: row.verification_id })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setParams({ open: row.verification_id });
                    }}
                  >
                    <Td className="font-mono text-[12.5px] align-top">{row.reference_id}</Td>
                    <Td className="whitespace-nowrap align-top">{formatDate(row.submitted_at)}</Td>
                    <Td className="align-top">
                      <div className="font-medium">{row.title ?? row.nature}</div>
                      <div className="text-[12px] text-ink-subtle">
                        {[row.act, row.department, row.location].filter(Boolean).join(" · ") || row.nature}
                      </div>
                    </Td>
                    {multiClient ? <Td className="align-top">{row.client_name ?? "—"}</Td> : null}
                    <Td className="align-top">
                      <CriticalityPill value={row.criticality} />
                    </Td>
                    <Td className="align-top">
                      <FlagPill row={row} />
                    </Td>
                    <Td className="align-top">
                      <Button size="sm" variant="secondary" onClick={() => setParams({ open: row.verification_id })}>
                        Review
                      </Button>
                    </Td>
                  </Tr>
                ))
              )}
            </tbody>
          </Table>
        </TableScroll>

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5 text-[12.5px] text-ink-subtle">
          <span>
            Showing {data?.total ? page * PAGE_SIZE + 1 : 0}–{Math.min(data?.total ?? 0, (page + 1) * PAGE_SIZE)} of{" "}
            {formatInteger(data?.total ?? 0)}
          </span>
          <div className="flex gap-1.5">
            <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setParams({ page: page > 1 ? String(page - 1) : null })}>
              Previous
            </Button>
            <Button size="sm" variant="secondary" disabled={page >= pages - 1} onClick={() => setParams({ page: String(page + 1) })}>
              Next
            </Button>
          </div>
        </div>
      </section>

      {open ? <ReviewSheet staff={staff} verificationId={open} onClose={() => setParams({ open: null })} /> : null}
    </>
  );
}

function FlagPill({ row }: { row: InsightReportRow }) {
  if (row.job_status === "QUEUED" || row.job_status === "PROCESSING") return <Pill tone="info">Checking</Pill>;
  if (row.job_status === "ERRORED") return <Pill tone="warn">Could not check</Pill>;
  if (!row.red_flag) return <Pill tone="pass">No</Pill>;
  return (
    <Pill tone="fail">
      Yes · {row.issues} {row.issues === 1 ? "issue" : "issues"}
    </Pill>
  );
}
