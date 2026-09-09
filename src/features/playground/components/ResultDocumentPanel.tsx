import { ChevronDown } from "lucide-react";

function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

/**
 * What the document turned out to say — the raw extraction, folded away.
 *
 * A disclosure rather than a panel, and closed by default, because every value
 * that produced a check is already in the row-level table above under
 * "Extracted". What is only here is the rest: keys the extractor returned that
 * the nature declares no check for, and keys the tenant expected that never
 * came back at all. That second list is the one worth opening this for — a
 * field with no check is invisible everywhere else on the board.
 *
 * There is deliberately no picture of the page. The console never fetches the
 * bytes, so anything page-shaped here would be a drawing of a document nobody
 * has seen.
 */
export function ResultDocumentPanel({
  extracted,
  expected,
}: {
  extracted: Record<string, unknown> | null;
  expected: Record<string, unknown>;
}) {
  const read = Object.keys(extracted ?? {});
  const unread = Object.keys(expected).filter((key) => !read.includes(key));

  return (
    <details className="panel group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 group-open:border-b group-open:border-line [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-[12.5px] font-medium text-ink">What the document said</span>
          <span className="mt-1 block text-[13px] text-ink-muted">
            {read.length} field{read.length === 1 ? "" : "s"} extracted
            {unread.length > 0 ? (
              <>
                {" · "}
                <span className="text-warn">
                  {unread.length} expected field{unread.length === 1 ? "" : "s"} never read
                </span>
              </>
            ) : null}
          </span>
        </span>
        <ChevronDown
          aria-hidden
          className="size-4 shrink-0 text-ink-subtle transition-transform duration-200 group-open:rotate-180"
        />
      </summary>

      <div className="grid gap-0.5 p-4 sm:grid-cols-2">
        {read.length === 0 && unread.length === 0 ? (
          <p className="py-4 text-center text-[12.5px] text-ink-muted sm:col-span-2">
            Nothing was extracted and nothing was expected.
          </p>
        ) : null}

        {read.map((key) => (
          <div
            key={key}
            className="flex items-baseline justify-between gap-3 rounded-md px-2 py-1.5 font-mono text-[11.5px]"
          >
            <span className="shrink-0 text-ink-subtle">{key}</span>
            <span
              className="min-w-0 truncate text-right text-ink"
              title={display(extracted?.[key])}
            >
              {display(extracted?.[key])}
            </span>
          </div>
        ))}

        {unread.map((key) => (
          <div
            key={key}
            className="flex items-baseline justify-between gap-3 rounded-md px-2 py-1.5 font-mono text-[11.5px]"
          >
            <span className="shrink-0 text-ink-subtle">{key}</span>
            <span className="min-w-0 truncate text-right text-ink-subtle italic">
              {display(expected[key])} · not read
            </span>
          </div>
        ))}
      </div>
    </details>
  );
}
