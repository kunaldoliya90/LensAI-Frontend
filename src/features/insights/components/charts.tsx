"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatInteger } from "@/lib/format";
import type { InsightBreakdown, InsightTrendPoint } from "@/lib/api/types";

// --- KPI strip ---------------------------------------------------------------

export type KpiTone = "good" | "bad" | "risk" | undefined;

const TONE_MARK: Record<Exclude<KpiTone, undefined>, string> = {
  good: "before:bg-pass",
  bad: "before:bg-[var(--chart-flag)]",
  risk: "before:bg-warn",
};

/** One row of headline figures, separated by hairlines rather than cards. */
export function KpiStrip({ children }: { children: ReactNode }) {
  return (
    <section className="panel grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] overflow-hidden p-0 [&>*]:border-r [&>*]:border-b [&>*]:border-line">
      {children}
    </section>
  );
}

export function Kpi({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  tone?: KpiTone;
}) {
  return (
    <div className="-mr-px -mb-px flex flex-col gap-1 px-[18px] py-4">
      <span
        className={cn(
          "flex items-center gap-[7px] text-[12.5px] font-medium text-ink-muted",
          tone && "before:size-[7px] before:shrink-0 before:rounded-[2px]",
          tone && TONE_MARK[tone],
        )}
      >
        {label}
      </span>
      <span className="figure text-[26px] leading-tight font-semibold tracking-[-0.02em] text-ink">
        {value}
      </span>
      {note ? <span className="text-[12px] text-ink-subtle">{note}</span> : null}
    </div>
  );
}

export function Delta({ points }: { points: number }) {
  const good = points <= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[3px] rounded-[4px] px-1.5 py-px text-[12px] font-semibold",
        good ? "bg-pass-soft text-pass" : "bg-fail-soft text-fail",
      )}
    >
      {good ? "▼" : "▲"} {Math.abs(points).toFixed(1)} pts
    </span>
  );
}

// --- Panel chrome ------------------------------------------------------------

export function InsightPanel({
  title,
  sub,
  aside,
  children,
  className,
}: {
  title: string;
  sub?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel min-w-0 p-5", className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div>
          <h2 className="text-[14.5px] font-semibold text-ink">{title}</h2>
          {sub ? <div className="mt-0.5 text-[12.5px] text-ink-subtle">{sub}</div> : null}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Legend({
  items,
}: {
  items: { key?: string; label: string; color: string; line?: boolean }[];
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-muted">
      {items.map((item) => (
        <span key={item.key ?? item.label} className="inline-flex items-center gap-1.5">
          <i
            aria-hidden
            className={cn("inline-block rounded-[2px]", item.line ? "h-0.5 w-3.5" : "size-2.5")}
            style={{ background: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

// --- Monthly trend -----------------------------------------------------------

/**
 * Bars: verifications checked, the red-flagged part in red. Line: the red-flag
 * rate on its own right-hand axis. One chart because the two questions are
 * read together — "is volume up?" and "are they getting it right?".
 */
export function TrendChart({ points }: { points: InsightTrendPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = 250;
  const L = 40;
  const R = 44;
  const T = 14;
  const B = 30;
  const iw = W - L - R;
  const ih = H - T - B;
  const maxV = Math.max(10, ...points.map((p) => p.checked));
  const step = maxV > 200 ? 50 : maxV > 80 ? 20 : maxV > 40 ? 10 : 5;
  const top = Math.ceil(maxV / step) * step;
  const rTop = Math.max(40, Math.ceil(Math.max(0, ...points.map((p) => p.rate)) / 10) * 10);
  const bw = iw / Math.max(1, points.length);
  const bar = Math.min(34, bw * 0.56);
  const y = (v: number) => T + ih - (ih * v) / top;
  const yr = (v: number) => T + ih - (ih * v) / rTop;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const rateTicks = Array.from({ length: rTop / 10 + 1 }, (_, i) => i * 10);
  const line = points
    .map((p, i) => (p.checked ? `${L + bw * i + bw / 2},${yr(p.rate)}` : null))
    .filter(Boolean);
  const shown = hover === null ? null : points[hover];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full overflow-visible"
        role="img"
        aria-label="Monthly verifications checked and red-flag rate"
      >
        {ticks.map((v) => (
          <g key={`t${v}`}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--color-line)" strokeDasharray={v ? "3 4" : undefined} />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--color-ink-subtle)">
              {v}
            </text>
          </g>
        ))}
        {rateTicks.map((v) => (
          <text key={`r${v}`} x={W - R + 8} y={yr(v) + 4} fontSize="11" fill="var(--color-ink-subtle)">
            {v}%
          </text>
        ))}
        {points.map((p, i) => {
          const cx = L + bw * i + bw / 2;
          return (
            <g key={p.month}>
              <rect x={cx - bar / 2} y={y(p.checked)} width={bar} height={Math.max(0, y(p.red_flagged) - y(p.checked) - 1)} rx="2" fill="var(--chart-base)" />
              <rect x={cx - bar / 2} y={y(p.red_flagged)} width={bar} height={y(0) - y(p.red_flagged)} rx="1" fill="var(--chart-flag)" />
              <text x={cx} y={H - 10} textAnchor="middle" fontSize="11" fill="var(--color-ink-subtle)">
                {p.label.slice(0, 3)}
                {p.partial ? "*" : ""}
              </text>
            </g>
          );
        })}
        {line.length > 1 ? (
          <polyline points={line.join(" ")} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" />
        ) : null}
        {points.map((p, i) =>
          p.checked ? (
            <circle key={`c${p.month}`} cx={L + bw * i + bw / 2} cy={yr(p.rate)} r={i === points.length - 1 ? 4.5 : 2.6} fill="var(--color-ground)" stroke="var(--color-accent)" strokeWidth="2" />
          ) : null,
        )}
        {points.map((p, i) => (
          <rect
            key={`h${p.month}`}
            x={L + bw * i}
            y={T}
            width={bw}
            height={ih}
            fill={hover === i ? "var(--color-surface-strong)" : "transparent"}
            fillOpacity={0.6}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>
      {shown ? (
        <div className="pointer-events-none absolute top-0 right-0 rounded-md bg-ink px-2.5 py-2 text-[12.5px] text-ground shadow-lg">
          <b className="block">
            {shown.label}
            {shown.partial ? " (to date)" : ""}
          </b>
          {formatInteger(shown.checked)} checked · {formatInteger(shown.red_flagged)} red-flagged
          <br />
          Red-flag rate {shown.rate.toFixed(1)}%
        </div>
      ) : null}
    </div>
  );
}

// --- Horizontal breakdowns ----------------------------------------------------

/**
 * Red-flagged of checked per value, each row a button that toggles the page
 * filter. The grey bar is everything checked, the red overlay the flagged
 * part, both on one scale so rows compare by length.
 */
export function BreakdownRows({
  items,
  selected,
  onSelect,
  limit = 7,
}: {
  items: InsightBreakdown[];
  selected?: string;
  onSelect?: (key: string) => void;
  limit?: number;
}) {
  const [all, setAll] = useState(false);
  const max = Math.max(1, ...items.map((i) => i.total));
  const shown = all ? items : items.slice(0, limit);
  if (items.length === 0) {
    return <p className="py-10 text-center text-[13px] text-ink-subtle">No compliances in this scope.</p>;
  }
  return (
    <>
      <div className="flex flex-col gap-px">
        {shown.map((item) => (
          <BarRow
            key={item.key}
            label={item.label}
            pressed={selected === item.key}
            onClick={onSelect ? () => onSelect(item.key) : undefined}
            title={`${item.label}: ${item.red_flagged} red-flagged of ${item.total} checked`}
            value={
              <>
                <b className="text-[13px] font-semibold text-ink">{formatInteger(item.red_flagged)}</b> /{" "}
                {formatInteger(item.total)}
              </>
            }
          >
            <span className="absolute inset-y-0 left-0 rounded-[2px] bg-[var(--chart-base)]" style={{ width: `${(100 * item.total) / max}%` }} />
            <span className="absolute inset-y-0 left-0 rounded-[2px] bg-[var(--chart-flag)]" style={{ width: `${(100 * item.red_flagged) / max}%` }} />
          </BarRow>
        ))}
      </div>
      {items.length > limit ? (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          className="mt-2 px-0.5 py-1 text-[12.5px] font-medium text-accent hover:underline hover:underline-offset-[3px]"
        >
          {all ? "Show fewer" : `Show all ${items.length}`}
        </button>
      ) : null}
    </>
  );
}

export function BarRow({
  label,
  value,
  pressed,
  onClick,
  title,
  children,
}: {
  label: string;
  value: ReactNode;
  pressed?: boolean;
  onClick?: () => void;
  title?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-pressed={onClick ? pressed : undefined}
      title={title}
      className={cn(
        "grid w-full grid-cols-[minmax(64px,104px)_minmax(0,1fr)_64px] items-center gap-2 rounded-md border border-transparent px-2 py-[7px] text-left disabled:cursor-default sm:grid-cols-[minmax(90px,160px)_minmax(0,1fr)_96px] sm:gap-3.5",
        onClick && "cursor-pointer hover:bg-surface-strong",
        pressed && "border-accent/30 bg-accent-soft",
      )}
    >
      <span className="truncate text-[13px] text-ink">{label}</span>
      <span className="relative h-3">{children}</span>
      <span className="text-right text-[12px] whitespace-nowrap text-ink-subtle tabular-nums">{value}</span>
    </button>
  );
}

// --- Stacked monthly bars (Usage) ----------------------------------------------

export const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)", "var(--series-5)"];

export function StackedMonthly({
  months,
  series,
}: {
  months: { month: string; label: string; partial: boolean; values: Record<string, number> }[];
  series: { key: string; label: string; color: string }[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  // Drawn wider than the trend chart because it spans the full page: with a
  // 640 viewBox the axis labels scaled up to nearly twice their size.
  const W = 1040;
  const H = 260;
  const L = 40;
  const T = 12;
  const B = 30;
  const iw = W - L - 16;
  const ih = H - T - B;
  const totals = months.map((m) => Object.values(m.values).reduce((a, b) => a + b, 0));
  const maxV = Math.max(10, ...totals);
  const step = maxV > 120 ? 40 : maxV > 60 ? 20 : 10;
  const top = Math.ceil(maxV / step) * step;
  const y = (v: number) => T + ih - (ih * v) / top;
  const bw = iw / Math.max(1, months.length);
  const bar = Math.min(34, bw * 0.58);
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const shown = hover === null ? null : months[hover];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" role="img" aria-label="Monthly verifications by client">
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - 16} y1={y(v)} y2={y(v)} stroke="var(--color-line)" strokeDasharray={v ? "3 4" : undefined} />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--color-ink-subtle)">
              {v}
            </text>
          </g>
        ))}
        {months.map((m, i) => {
          const cx = L + bw * i + bw / 2;
          let acc = 0;
          return (
            <g key={m.month}>
              {series.map((s) => {
                const n = m.values[s.key] ?? 0;
                if (!n) return null;
                const rect = <rect key={s.key} x={cx - bar / 2} y={y(acc + n)} width={bar} height={Math.max(0, y(acc) - y(acc + n) - 1)} rx="2" fill={s.color} />;
                acc += n;
                return rect;
              })}
              <text x={cx} y={H - 10} textAnchor="middle" fontSize="11" fill="var(--color-ink-subtle)">
                {m.label.slice(0, 3)}
                {m.partial ? "*" : ""}
              </text>
              <rect
                x={L + bw * i}
                y={T}
                width={bw}
                height={ih}
                fill={hover === i ? "var(--color-surface-strong)" : "transparent"}
                fillOpacity={0.5}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          );
        })}
      </svg>
      {shown ? (
        <div className="pointer-events-none absolute top-0 right-0 max-w-[240px] rounded-md bg-ink px-2.5 py-2 text-[12.5px] text-ground shadow-lg">
          <b className="block">{shown.label}</b>
          {series.map((s) => (
            <span key={s.key} className="block">
              {s.label}: {shown.values[s.key] ?? 0}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
