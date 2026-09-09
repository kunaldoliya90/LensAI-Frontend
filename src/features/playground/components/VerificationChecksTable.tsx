import { Table, TableMessage, TableScroll, Td, Th, Tr } from "@/components/ui/Table";
import { cn } from "@/lib/cn";
import type { CheckResult } from "@/lib/api/types";

/**
 * The status word's colour. Bare coloured text rather than a pill: a wide
 * nature produces forty of these rows, and forty pills is a rash. The word is
 * always present, so the colour is never carrying the meaning alone.
 */
const STATUS_TEXT: Record<string, string> = {
  MATCH: "text-pass",
  MISMATCH: "text-fail",
  NOT_VERIFIABLE: "text-warn",
  NOT_SPECIFIED: "text-ink-subtle",
};

/**
 * A stripe down the left of any row that did not simply agree, so the rows a
 * person has to read are findable by shape and not only by colour — which is
 * what makes a forty-row table scannable in one pass.
 */
const STATUS_MARK: Record<string, string> = {
  MISMATCH:
    "shadow-[inset_2px_0_0_var(--color-fail)] hover:shadow-[inset_2px_0_0_var(--color-fail)]",
  NOT_VERIFIABLE:
    "shadow-[inset_2px_0_0_var(--color-warn)] hover:shadow-[inset_2px_0_0_var(--color-warn)]",
  NOT_SPECIFIED:
    "shadow-[inset_2px_0_0_var(--color-line-strong)] hover:shadow-[inset_2px_0_0_var(--color-line-strong)]",
};

/**
 * Every comparison the pipeline made, one row each.
 *
 * This is the whole of a check in one place — what was expected, what the
 * document actually said, the call, how sure the extractor was, whether the
 * check could move the verdict, which plugin made it, and the remark explaining
 * it. It replaced a three-panel arrangement where the row had to be clicked
 * before most of that appeared: a verdict is read by scanning the
 * disagreements, and a table you scan beats a detail pane you interrogate.
 */
export function VerificationChecksTable({ checks }: { checks: CheckResult[] }) {
  return (
    <section className="grid gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[12.5px] font-medium text-ink">Row-level verdicts</h2>
        <p className="font-mono text-[10.5px] text-ink-subtle">
          {checks.length} comparison{checks.length === 1 ? "" : "s"} · expected → extracted
        </p>
      </div>

      <TableScroll>
        <Table className="min-w-[72rem]">
          <thead>
            <Tr>
              <Th>Field</Th>
              <Th>Expected</Th>
              <Th>Extracted</Th>
              <Th>Result</Th>
              <Th className="text-right">Confidence</Th>
              <Th>Severity</Th>
              <Th>Check</Th>
              <Th>Remarks</Th>
            </Tr>
          </thead>
          <tbody>
            {checks.length === 0 ? (
              <TableMessage columns={8}>
                No per-field checks were recorded. A job that errored before the check stage has
                none, and a document nothing could be read from has none either.
              </TableMessage>
            ) : (
              checks.map((check) => (
                <Tr
                  key={`${check.field_name}-${check.check_plugin}`}
                  className={STATUS_MARK[check.match_status]}
                >
                  <Td className="font-mono text-[11.5px] whitespace-nowrap text-ink">
                    {check.field_name}
                  </Td>
                  <Td className="font-mono text-[11.5px]">{check.expected_value ?? "—"}</Td>
                  <Td
                    className={cn(
                      "font-mono text-[11.5px]",
                      check.extracted_value ? "text-ink" : "text-ink-subtle italic",
                    )}
                  >
                    {check.extracted_value ?? "no legible value"}
                  </Td>
                  <Td
                    className={cn(
                      "text-[11.5px] tracking-[0.03em] whitespace-nowrap",
                      STATUS_TEXT[check.match_status] ?? "text-ink-subtle",
                    )}
                  >
                    {check.match_status.replace(/_/g, " ")}
                  </Td>
                  <Td className="text-right font-mono text-[11.5px] tabular-nums">
                    {check.confidence ?? "—"}
                  </Td>
                  <Td className="font-mono text-[10.5px] whitespace-nowrap text-ink-subtle uppercase">
                    {check.severity}
                  </Td>
                  <Td className="font-mono text-[10.5px] whitespace-nowrap text-ink-subtle">
                    {check.check_plugin}
                  </Td>
                  {/* Clamped rather than truncated: a remark's first two lines
                      almost always contain the reason, and the full text is on
                      the title for the one that does not. */}
                  <Td className="min-w-[16rem] max-w-[26rem] text-[12px] leading-snug">
                    <span
                      title={check.remarks ?? undefined}
                      className={cn("line-clamp-2", check.remarks ? null : "text-ink-subtle")}
                    >
                      {check.remarks ?? "—"}
                    </span>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </TableScroll>
    </section>
  );
}
