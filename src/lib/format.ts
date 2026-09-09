export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function formatUtc(iso: string): string {
  return `${new Date(iso).toISOString().replace("T", " ").slice(0, 19)} UTC`;
}

export function formatInteger(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[unit]}`;
}

export function formatDuration(milliseconds: number): string {
  return milliseconds < 1000 ? `${milliseconds} ms` : `${(milliseconds / 1000).toFixed(2)} s`;
}

/** `YYYY-MM-DD` in the viewer's own timezone — the shape the usage filters take. */
export function toDateParam(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function currentMonthRange(): { from: string; to: string } {
  const now = new Date();
  return {
    from: toDateParam(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toDateParam(now),
  };
}

/**
 * The same span of days, one month earlier — the comparison behind "vs last month".
 *
 * Ends on the same day of the month rather than at the month's end, because
 * comparing 12 elapsed days against a full 31 would report a collapse in volume
 * on the 12th of every month. `new Date(y, m, d)` normalizes an overflowing day,
 * so a 31st compares against the last day of a shorter month rather than rolling
 * into the next one.
 */
export function previousMonthRange(): { from: string; to: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() - 1;
  return {
    from: toDateParam(new Date(year, month, 1)),
    to: toDateParam(new Date(year, month, now.getDate())),
  };
}

/**
 * Percentage change, or null when there is nothing to compare against.
 *
 * Null rather than 0 or Infinity: a first month of use has no baseline, and
 * rendering that as "0%" claims the volume held steady while "∞%" is not a
 * number anyone can read. The caller shows neither.
 */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

/** A signed percentage for display: `+12%`, `-6%`, `0%`. */
export function formatPercentChange(percent: number): string {
  const rounded = Math.round(percent);
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}
