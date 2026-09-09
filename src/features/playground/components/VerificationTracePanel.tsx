"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { StatusPill } from "@/components/StatusPill";
import { Table, TableMessage, TableScroll, Td, Th, Tr } from "@/components/ui/Table";
import { formatDuration } from "@/lib/format";
import { getVerificationTrace } from "../api/playground";

export function VerificationTracePanel({
  apiKey,
  verificationId,
}: {
  apiKey: string;
  verificationId: string;
}) {
  const [open, setOpen] = useState(false);

  const trace = useQuery({
    queryKey: ["verification-trace", verificationId],
    queryFn: () => getVerificationTrace(apiKey, verificationId),
    enabled: open,
  });

  return (
    // The same disclosure as the archive below it. `open` is still tracked,
    // because it is what enables the query — the trace is fetched when someone
    // asks for it, not on every result.
    <details
      className="panel group"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 group-open:border-b group-open:border-line [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-[12.5px] font-medium">Pipeline trace</span>
          <span className="mt-1 block text-[13px] text-ink-muted">
            Every plugin that ran, one row each — the detail behind the roll-up above.
          </span>
        </span>
        <ChevronDown
          aria-hidden
          className="size-4 shrink-0 text-ink-subtle transition-transform duration-200 group-open:rotate-180"
        />
      </summary>

      {open ? (
        <div className="grid gap-4 p-4">
          {trace.isError ? <ErrorNotice error={trace.error} /> : null}
          {trace.isPending ? <p className="text-sm text-ink-muted">Loading trace…</p> : null}

          {trace.data ? (
            <>
              <div>
                <h4 className="mb-2 text-[13px] font-semibold">Steps</h4>
                <TableScroll>
                  <Table className="min-w-[56rem]">
                    <thead>
                      <Tr>
                        <Th>#</Th>
                        <Th>Stage</Th>
                        <Th>Plugin</Th>
                        <Th>Status</Th>
                        <Th>Severity</Th>
                        <Th className="text-right">Duration</Th>
                        <Th>Data</Th>
                      </Tr>
                    </thead>
                    <tbody>
                      {trace.data.steps.length === 0 ? (
                        <TableMessage columns={7}>No steps recorded for this job.</TableMessage>
                      ) : null}

                      {trace.data.steps.map((step) => (
                        <Tr key={`${step.sequence}-${step.plugin_name}`}>
                          <Td className="text-ink-muted tabular-nums">{step.sequence}</Td>
                          <Td className="font-mono text-[12px]">{step.stage}</Td>
                          <Td className="font-mono text-[12px]">
                            {step.plugin_name}
                            <span className="ml-1 text-ink-subtle">{step.plugin_version}</span>
                          </Td>
                          <Td>
                            <StatusPill value={step.status} />
                          </Td>
                          <Td className="text-ink-muted">{step.severity}</Td>
                          <Td className="text-right font-mono tabular-nums">
                            {formatDuration(step.duration_ms)}
                          </Td>
                          <Td className="max-w-[30ch]">
                            {step.error ? (
                              <span className="text-[12px] text-fail">{step.error}</span>
                            ) : step.data ? (
                              <code className="font-mono text-[11.5px] break-all">
                                {JSON.stringify(step.data)}
                              </code>
                            ) : (
                              "—"
                            )}
                          </Td>
                        </Tr>
                      ))}
                    </tbody>
                  </Table>
                </TableScroll>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </details>
  );
}
