"use client";

import { useState } from "react";
import { formatDate, formatInteger } from "@/lib/format";
import type { UsageLine } from "@/lib/api/types";

/**
 * Verifications per day. One series, so no legend — the caption names it.
 *
 * Built from DOM elements rather than an SVG viewBox on purpose: a scaled
 * viewBox scales its text too, and the axis labels become unreadable on a
 * phone. Here they stay real text at a real size at every width.
 *
 * Counts are summed across provider scopes, which is safe: a verification ran
 * once regardless of which model served it. Tokens are the figure that must
 * never be summed across scopes, and those live on the usage report.
 */

/**
 * The bar's fill, taken from the ground rather than fixed.
 *
 * It was a flat `#6366f1`, chosen against one dark panel, and then a gradient
 * derived from `--color-accent`. That derivation is still the default, and it
 * is what Porcelain uses — but a ground may want a fill its accent cannot
 * describe, as Neon does with its cyan-into-violet bar, so the whole gradient
 * is a token now. Either way it is lightened at the top, because a bar on a
 * pane of glass should look lit from the same direction the pane is.
 */
const BAR = "var(--bar-image)";

/**
 * Round up to a clean axis maximum that is also even, so the midpoint tick is a
 * whole number. Without the even constraint a peak of 1 gives ticks 1 / 0.5 / 0,
 * which renders as "1 / 1 / 0" once the labels are rounded to integers.
 */
function niceCeiling(value: number): number {
  if (value <= 0) return 2;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  for (const step of [2, 4, 6, 8, 10]) {
    const candidate = step * magnitude;
    if (candidate >= value) return candidate;
  }
  return 10 * magnitude;
}

function byDay(lines: UsageLine[]): { date: string; verifications: number }[] {
  const totals = new Map<string, number>();
  for (const line of lines) {
    totals.set(line.usage_date, (totals.get(line.usage_date) ?? 0) + line.verifications);
  }
  return [...totals.entries()]
    .map(([date, verifications]) => ({ date, verifications }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function VerificationsChart({ lines, loading }: { lines: UsageLine[]; loading: boolean }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const days = byDay(lines);
  const peak = Math.max(0, ...days.map((day) => day.verifications));
  const ceiling = niceCeiling(peak);
  const peakIndex = days.findIndex((day) => day.verifications === peak && peak > 0);
  const total = days.reduce((sum, day) => sum + day.verifications, 0);

  return (
    <figure className="panel p-4">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[12.5px] font-medium text-ink">Verifications per day</h3>
        <p className="text-[12.5px] text-ink-muted">
          {formatInteger(total)} this period
        </p>
      </figcaption>

      {loading ? (
        <div className="grid h-[13.5rem] place-content-center text-center text-[13.5px] text-ink-muted">
          Loading usage…
        </div>
      ) : days.length === 0 ? (
        // The same height as the plotted chart, so a month with nothing in it
        // does not shrink the panel and pull the whole page out of alignment.
        <div className="grid h-[13.5rem] place-content-center gap-1 text-center">
          <p className="text-[13.5px] text-ink-muted">Nothing verified in this period yet.</p>
          <p className="text-[12px] text-ink-subtle">
            The chart fills in as jobs complete — one bar per day.
          </p>
        </div>
      ) : (
        <div className="mt-5 flex gap-3">
          {/* Y axis. Three ticks is enough to read a magnitude from. */}
          <div className="flex h-40 w-10 shrink-0 flex-col justify-between text-right text-[11px] tabular-nums text-ink-subtle">
            <span>{formatInteger(ceiling)}</span>
            <span>{formatInteger(ceiling / 2)}</span>
            <span>0</span>
          </div>

          <div className="relative min-w-0 flex-1">
            {/* Hairline gridlines, recessive and solid. */}
            <div aria-hidden className="absolute inset-x-0 top-0 h-40">
              {[0, 50, 100].map((offset) => (
                <div
                  key={offset}
                  className="absolute inset-x-0 border-t border-line"
                  style={{ top: `${offset}%` }}
                />
              ))}
            </div>

            <div className="relative flex h-40 items-end gap-[2px]">
              {days.map((day, index) => {
                const height = ceiling === 0 ? 0 : (day.verifications / ceiling) * 100;
                const active = hovered === index;

                return (
                  <button
                    key={day.date}
                    type="button"
                    // The hit target is the whole column, not the painted bar.
                    className="group relative flex h-full min-w-0 flex-1 cursor-default items-end focus:outline-none"
                    onPointerEnter={() => setHovered(index)}
                    onPointerLeave={() => setHovered(null)}
                    onFocus={() => setHovered(index)}
                    onBlur={() => setHovered(null)}
                    aria-label={`${formatDate(day.date)}: ${formatInteger(day.verifications)} verifications`}
                  >
                    {/* The bar rises into place once, in a wave across the
                        period. scaleY rather than an animated height, so the
                        keyframe never has to know how tall this one is. */}
                    <span
                      className="bar-grow mx-auto block w-full max-w-[24px] rounded-t-[4px] transition-[filter,box-shadow,opacity]"
                      style={{
                        height: `${Math.max(height, day.verifications > 0 ? 2 : 0)}%`,
                        backgroundImage: BAR,
                        animationDelay: `${Math.min(index * 22, 400)}ms`,
                        filter: active ? "brightness(1.2)" : undefined,
                        boxShadow: active ? "0 0 18px -4px var(--color-accent)" : undefined,
                      }}
                    />

                    {/* Only the peak is labelled. A number on every column is noise. */}
                    {index === peakIndex ? (
                      <span
                        className="pointer-events-none absolute inset-x-0 text-center text-[11px] font-medium tabular-nums text-ink"
                        style={{ bottom: `calc(${height}% + 4px)` }}
                      >
                        {formatInteger(day.verifications)}
                      </span>
                    ) : null}

                    {active ? (
                      <span // Opaque, not the inset tint: this floats over the bars, and the
                        // console palette makes surface-strong translucent.
                        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-md border border-line-strong bg-ground px-2 py-1.5 text-center whitespace-nowrap shadow-md">
                        <span className="block text-[13px] font-semibold tabular-nums text-ink">
                          {formatInteger(day.verifications)}
                        </span>
                        <span className="block text-[11px] text-ink-muted">
                          {formatDate(day.date)}
                        </span>
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 flex justify-between text-[11px] text-ink-subtle">
              <span>{formatDate(days[0].date)}</span>
              {days.length > 1 ? <span>{formatDate(days[days.length - 1].date)}</span> : null}
            </div>
          </div>
        </div>
      )}

      {/* Every value the tooltip shows, reachable without hovering. */}
      <table className="sr-only">
        <caption>Verifications per day</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Verifications</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.date}>
              <td>{formatDate(day.date)}</td>
              <td>{formatInteger(day.verifications)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
