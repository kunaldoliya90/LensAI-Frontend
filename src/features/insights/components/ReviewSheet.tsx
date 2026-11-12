"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, FileText, Flag } from "lucide-react";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Button } from "@/components/ui/Button";
import { Pill, type Tone } from "@/components/ui/Pill";
import { Table, TableScroll, Td, Th } from "@/components/ui/Table";
import { cn } from "@/lib/cn";
import { formatDate, formatDateTime } from "@/lib/format";
import type { CheckResult, InsightsDetail, MatchStatus } from "@/lib/api/types";
import { getDetail } from "../api/insights";
import { formatSeconds } from "../scope";
import { CriticalityPill } from "./badges";

const STATUS: Record<MatchStatus, [Tone, string]> = {
  MATCH: ["pass", "Match"],
  MISMATCH: ["fail", "Mismatch"],
  NOT_SPECIFIED: ["neutral", "Not specified"],
  NOT_VERIFIABLE: ["warn", "Not verifiable"],
};

const INTEGRITY_LABEL: Record<string, string> = {
  "integrity.pdf_overlay": "PDF forgery (overlay)",
  "integrity.metadata": "Document metadata",
  "integrity.blank_page": "Blank document",
};

// Opens as a modal so focus is trapped and Esc closes it; the ref runs once.
const openDialog = (element: HTMLDialogElement | null) => {
  if (element && !element.open) element.showModal();
};

/**
 * One verification's AI review, as a side sheet over the report. The verdict
 * comes first, then who and what it was about, then every check — the row a
 * reviewer acts on is the mismatch, so "Issues only" is one click away.
 */
export function ReviewSheet({
  staff,
  verificationId,
  onClose,
}: {
  staff: boolean;
  verificationId: string;
  onClose: () => void;
}) {
  const detail = useQuery({
    queryKey: ["insights", "detail", staff, verificationId],
    queryFn: () => getDetail(staff, verificationId),
  });

  return (
    <dialog
      ref={openDialog}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label="AI red-flag review"
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-[min(1040px,100%)] max-w-none overflow-y-auto border-l border-line bg-surface p-0 text-ink shadow-lg backdrop:bg-[rgb(16_24_40/0.45)]"
    >
      <div className="flex flex-col gap-4 px-4 pt-[18px] pb-8 sm:px-7">
        <div className="flex items-center justify-between gap-2.5">
          <Button variant="secondary" size="sm" onClick={onClose} autoFocus>
            ← Back to report
          </Button>
          <span className="text-[12.5px] text-ink-subtle">Press Esc to close</span>
        </div>
        {detail.error ? <ErrorNotice error={detail.error} /> : null}
        {detail.isPending ? <p className="text-[13px] text-ink-muted">Loading the review…</p> : null}
        {detail.data ? <ReviewBody data={detail.data} /> : null}
      </div>
    </dialog>
  );
}

function ReviewBody({ data }: { data: InsightsDetail }) {
  const [issuesOnly, setIssuesOnly] = useState(false);
  const record = data.context?.record ?? {};
  const matches = data.checks.filter((c) => c.match_status === "MATCH").length;
  // "Issues" means what the verdict counts — a mismatch, or a check that could
  // not run. A field the form left blank is not something to fix.
  const issueChecks = data.checks.filter(
    (c) => c.match_status === "MISMATCH" || c.match_status === "NOT_VERIFIABLE",
  );
  const shown = issuesOnly ? issueChecks : data.checks;
  const settled = data.job_status === "COMPLETED";
  const confidence = data.confidence_score === null ? null : Number(data.confidence_score);

  return (
    <>
      <div>
        <div className="font-mono text-[12px] text-ink-subtle">
          {data.reference_id} · {data.client_name ?? "Client"}
          {data.tenant_name ? ` · ${data.tenant_name}` : ""}
        </div>
        <h1 className="mt-1 text-[24px] font-semibold tracking-[-0.02em] text-balance">
          {record.title ?? data.nature_label}
        </h1>
        {record.act ? <div className="mt-1 text-[12px] text-ink-subtle">{record.act}</div> : null}
      </div>

      {settled ? (
        <div
          className={cn(
            "panel grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 border-l-4 px-5 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]",
            data.red_flag ? "border-l-[var(--chart-flag)]" : "border-l-pass",
          )}
        >
          <span
            className={cn(
              "grid size-9 place-items-center rounded-lg",
              data.red_flag ? "bg-fail-soft text-fail" : "bg-pass-soft text-pass",
            )}
          >
            {data.red_flag ? <Flag aria-hidden className="size-5" /> : <Check aria-hidden className="size-5" />}
          </span>
          <div>
            <h3 className="text-[15.5px] font-semibold">
              {data.red_flag
                ? `Red flag: ${data.issues} ${data.issues === 1 ? "issue" : "issues"} to fix before approval`
                : "No red flags: the documents support the submission"}
            </h3>
            <p className="mt-0.5 text-ink-muted">
              {matches} of {data.checks.length} checks matched.
              {data.red_flag ? " Each issue below shows what the form says, what the document shows, and why it matters." : ""}
            </p>
          </div>
          {confidence !== null ? (
            <div className="col-span-full border-line text-left sm:col-span-1 sm:border-l sm:pl-4 sm:text-right">
              <b className="block text-[22px] font-semibold tabular-nums">{confidence.toFixed(0)}%</b>
              <span className="text-[12px] text-ink-subtle">AI confidence</span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="panel px-5 py-4 text-ink-muted">
          {data.job_status === "ERRORED"
            ? `LensAI could not check this submission: ${data.failure_reason ?? "the pipeline failed"}.`
            : "LensAI is still checking this submission."}
        </div>
      )}

      <section className="panel grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-x-5 gap-y-3.5 p-5">
        <Meta label="Submitted on" value={formatDate(data.context?.submitted_at ?? data.created_at)} />
        <Meta label="Criticality" value={<CriticalityPill value={record.criticality} />} />
        <Meta label="Nature" value={data.nature_label} />
        <Meta label="Entity" value={record.entity} />
        <Meta label="Department · Location" value={[record.department, record.location].filter(Boolean).join(" · ") || null} />
        <Meta label="Period" value={record.period} />
        <Meta label="Submitter" value={personLabel(data.context?.submitted_by)} />
        <Meta label="Approver" value={personLabel(data.context?.approver)} />
      </section>

      {settled ? (
        <section className="panel min-w-0 p-5">
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5">
            <div>
              <h2 className="text-[14.5px] font-semibold">AI red-flag table</h2>
              <p className="mt-0.5 text-[12.5px] text-ink-subtle">
                Form values sent by the client&apos;s tool, compared with what LensAI read from the documents.
              </p>
            </div>
            <div role="group" aria-label="Rows shown" className="inline-flex overflow-hidden rounded-md border border-line-strong shadow-xs">
              {[
                [false, `All ${data.checks.length} checks`],
                [true, `Issues only · ${issueChecks.length}`],
              ].map(([value, label]) => (
                <button
                  key={String(value)}
                  type="button"
                  aria-pressed={issuesOnly === value}
                  onClick={() => setIssuesOnly(value as boolean)}
                  className={cn(
                    "h-8 border-r border-line-strong px-3 text-[13px] font-medium text-ink-muted last:border-r-0 hover:bg-surface-strong",
                    issuesOnly === value && "bg-deep-2 text-ink shadow-[inset_0_-2px_0_var(--color-accent)]",
                  )}
                >
                  {label as string}
                </button>
              ))}
            </div>
          </div>
          <TableScroll className="rounded-md shadow-none">
            <Table>
              <thead>
                <tr>
                  <Th>Check</Th>
                  <Th>In the form</Th>
                  <Th>In the document</Th>
                  <Th>Result</Th>
                  <Th>Confidence</Th>
                  <Th>Explanation</Th>
                </tr>
              </thead>
              <tbody>
                {shown.map((check) => (
                  <CheckRow key={`${check.field_name}-${check.check_plugin}`} check={check} />
                ))}
                {shown.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-ink-subtle">
                      No issues: every check matched.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </Table>
          </TableScroll>
        </section>
      ) : null}

      {data.integrity.length ? (
        <section className="panel p-5">
          <h2 className="text-[14.5px] font-semibold">Document integrity</h2>
          <p className="mt-0.5 mb-3.5 text-[12.5px] text-ink-subtle">Forgery, metadata and blank-page checks on the files themselves.</p>
          <div className="flex flex-wrap gap-2">
            {data.integrity.map((step) => (
              <span key={step.plugin} className="inline-flex h-8 items-center gap-2 rounded-md border border-line bg-deep-2 px-3 text-[13px]">
                {INTEGRITY_LABEL[step.plugin] ?? step.plugin}
                <Pill tone={step.status === "FAILED" ? "fail" : step.status === "OK" ? "pass" : "neutral"}>
                  {step.status === "FAILED" ? "Red flag" : step.status === "OK" ? "Pass" : "Skipped"}
                </Pill>
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel p-5">
        <h2 className="text-[14.5px] font-semibold">Documents read</h2>
        <p className="mt-0.5 mb-3.5 text-[12.5px] text-ink-subtle">Read in memory for this check and not stored by LensAI.</p>
        <div className="flex flex-wrap gap-2">
          {data.documents.map((doc, index) => (
            <span key={`${doc.file_name}-${index}`} className="inline-flex h-8 items-center gap-2 rounded-md border border-line bg-deep-2 px-3 text-[13px]">
              <FileText aria-hidden className="size-[15px] text-ink-subtle" />
              {doc.file_name}
            </span>
          ))}
          {data.pages ? (
            <span className="inline-flex h-8 items-center rounded-md border border-line bg-deep-2 px-3 text-[13px]">
              {data.pages} pages
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-[12.5px] text-ink-subtle">
          {data.processing_completed_at
            ? `Checked by LensAI on ${formatDateTime(data.processing_completed_at)} in ${formatSeconds(data.turnaround_seconds)} · `
            : ""}
          <span className="font-mono">{data.verification_id}</span>
        </p>
      </section>
    </>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="mb-0.5 block text-[12px] text-ink-subtle">{label}</span>
      <b className="font-medium">{value ?? "—"}</b>
    </div>
  );
}

function personLabel(person: { name?: string | null; email?: string | null } | null | undefined) {
  if (!person) return null;
  return person.name && person.email ? `${person.name} (${person.email})` : (person.name ?? person.email ?? null);
}

function CheckRow({ check }: { check: CheckResult }) {
  const [tone, label] = STATUS[check.match_status];
  const mismatch = check.match_status === "MISMATCH";
  const [expected, extracted] = mismatch
    ? highlightDiff(check.expected_value ?? "", check.extracted_value ?? "")
    : [check.expected_value, check.extracted_value];
  const confidence = check.confidence === null ? null : Number(check.confidence);

  return (
    <tr
      className={cn(
        "border-b border-line align-top last:border-b-0",
        mismatch && "bg-fail-soft/60 [&>td:first-child]:shadow-[inset_3px_0_0_var(--chart-flag)]",
        check.match_status === "NOT_VERIFIABLE" && "[&>td:first-child]:shadow-[inset_3px_0_0_var(--color-warn)]",
      )}
    >
      <Td className="align-top">
        <b className="font-semibold">{check.label ?? check.field_name}</b>
        <div className="text-[12px] text-ink-subtle capitalize">{check.severity}</div>
      </Td>
      <Td className="align-top font-mono text-[12.5px]">{expected ?? <span className="text-ink-subtle">Left blank</span>}</Td>
      <Td className="align-top font-mono text-[12.5px]">{extracted ?? <span className="text-ink-subtle">Not found</span>}</Td>
      <Td className="align-top">
        <Pill tone={tone}>{label}</Pill>
      </Td>
      <Td className="align-top">
        {confidence === null ? (
          <span className="text-ink-subtle">—</span>
        ) : (
          <span className="flex items-center gap-2 text-[12px] whitespace-nowrap text-ink-muted tabular-nums">
            <i className="relative inline-block h-1 w-10 overflow-hidden rounded-[2px] bg-[var(--chart-track)]">
              <i className="absolute inset-y-0 left-0 bg-ink-subtle" style={{ width: `${confidence}%` }} />
            </i>
            {confidence.toFixed(0)}%
          </span>
        )}
      </Td>
      <Td className="min-w-[230px] align-top text-[13px] text-ink-muted">
        {check.remarks ?? (check.match_status === "MATCH" ? "Matches the document." : "—")}
      </Td>
    </tr>
  );
}

/** Mark the part of two strings that differs, keeping the shared prefix and suffix plain. */
function highlightDiff(a: string, b: string): [React.ReactNode, React.ReactNode] {
  if (!a || !b || a === b) return [a || null, b || null];
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  let j = 0;
  while (j < a.length - i && j < b.length - i && a[a.length - 1 - j] === b[b.length - 1 - j]) j++;
  const mark = (s: string) => (
    <>
      {s.slice(0, i)}
      <span className="rounded-[2px] bg-fail-soft px-0.5 font-semibold text-fail outline outline-1 outline-fail/30">
        {s.slice(i, s.length - j)}
      </span>
      {s.slice(s.length - j)}
    </>
  );
  return [mark(a), mark(b)];
}
