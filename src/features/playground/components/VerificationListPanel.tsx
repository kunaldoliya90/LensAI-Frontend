"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, TableMessage, TableScroll, Td, Th, Tr } from "@/components/ui/Table";
import { Timestamp } from "@/components/ui/Timestamp";
import { numberIn, oneOf, useUrlParams } from "@/hooks/useUrlParams";
import type { JobStatus } from "@/lib/api/types";
import { listVerifications } from "../api/playground";

const JOB_STATUSES: JobStatus[] = ["QUEUED", "PROCESSING", "COMPLETED", "ERRORED", "CANCELLED"];
const PAGE_SIZES = [10, 25, 50, 100];

export function VerificationListPanel({
  apiKey,
  onOpen,
}: {
  apiKey: string;
  onOpen: (verificationId: string) => void;
}) {
  const { params, setParams } = useUrlParams();
  const jobStatus = params.get("status") ? oneOf(params.get("status"), JOB_STATUSES, "QUEUED") : "";
  const referenceId = params.get("ref") ?? "";
  const limit = numberIn(params.get("limit"), PAGE_SIZES, 25);

  const list = useInfiniteQuery({
    queryKey: ["verifications", apiKey, jobStatus, referenceId, limit],
    queryFn: ({ pageParam }) =>
      listVerifications({
        apiKey,
        cursor: pageParam,
        limit,
        jobStatus: (jobStatus || undefined) as JobStatus | undefined,
        referenceId: referenceId || undefined,
      }),
    initialPageParam: undefined as string | undefined,
    // The cursor is opaque and is passed back exactly as received.
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  });

  const items = list.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    // Closed by default. This is the archive, not the task: the page is for
    // verifying a document, and a filter bar plus a paginated table sitting open
    // underneath that is noise until someone goes looking for an old job.
    //
    // A native <details> rather than a toggle and a piece of state — the element
    // already does the disclosure, the keyboard and the semantics.
    <details className="panel group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 group-open:border-b group-open:border-line [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-[12.5px] font-medium">Recent verifications</span>
          <span className="mt-1 block text-[13px] text-ink-muted">
            Keyset-paginated, and in production the reconciliation sweep.
          </span>
        </span>
        <ChevronDown
          aria-hidden
          className="size-4 shrink-0 text-ink-subtle transition-transform duration-200 group-open:rotate-180"
        />
      </summary>

      <div className="p-4">
        <p className="text-[13px] text-ink-muted">
          Ask for everything changed since your last checkpoint with{" "}
          <code className="font-mono text-[12px]">updated_since</code>.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Input
            label="Filter by reference_id"
            mono
            defaultValue={referenceId}
            onBlur={(event) => setParams({ ref: event.target.value.trim() || null })}
          />
          <Select
            label="job_status"
            value={jobStatus}
            onChange={(event) => setParams({ status: event.target.value || null })}
          >
            <option value="">All statuses</option>
            {JOB_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
          <Select
            label="Page size"
            value={String(limit)}
            onChange={(event) => setParams({ limit: event.target.value })}
          >
            {PAGE_SIZES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </div>

        {list.isError ? (
          <div className="mt-3">
            <ErrorNotice error={list.error} />
          </div>
        ) : null}

        <div className="mt-4 grid gap-3">
          <TableScroll>
            <Table className="min-w-[52rem]">
              <thead>
                <Tr>
                  <Th>reference_id</Th>
                  <Th>job_status</Th>
                  <Th>verdict</Th>
                  <Th>Created</Th>
                  <Th>Updated</Th>
                  <Th>
                    <span className="sr-only">Actions</span>
                  </Th>
                </Tr>
              </thead>
              <tbody>
                {list.isPending ? <TableMessage columns={6}>Loading verifications…</TableMessage> : null}

                {!list.isPending && items.length === 0 ? (
                  <TableMessage columns={6}>
                    No verifications match. Submit one above, or widen the filter.
                  </TableMessage>
                ) : null}

                {items.map((item) => (
                  <Tr key={item.verification_id}>
                    <Td className="font-mono text-[12px] break-all">{item.reference_id}</Td>
                    <Td>
                      <StatusPill value={item.job_status} />
                    </Td>
                    <Td>
                      {item.job_status === "COMPLETED" ? (
                        <StatusPill value={item.verdict} />
                      ) : (
                        <span className="text-ink-subtle">—</span>
                      )}
                    </Td>
                    <Td className="text-ink-muted">
                      <Timestamp value={item.created_at} />
                    </Td>
                    <Td className="text-ink-muted">
                      <Timestamp value={item.updated_at} />
                    </Td>
                    <Td>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onOpen(item.verification_id)}
                      >
                        Open
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableScroll>

          {list.hasNextPage ? (
            <div>
              <Button
                variant="secondary"
                size="sm"
                disabled={list.isFetchingNextPage}
                onClick={() => list.fetchNextPage()}
              >
                {list.isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </details>
  );
}
