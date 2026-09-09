import { formatDate, formatDateTime, formatUtc } from "@/lib/format";

/** Local time for reading, UTC in the tooltip for comparing against a log. */
export function Timestamp({ value, dateOnly }: { value: string | null; dateOnly?: boolean }) {
  if (!value) return <span className="text-ink-subtle">—</span>;

  return (
    <time dateTime={value} title={formatUtc(value)} className="whitespace-nowrap">
      {dateOnly ? formatDate(value) : formatDateTime(value)}
    </time>
  );
}
