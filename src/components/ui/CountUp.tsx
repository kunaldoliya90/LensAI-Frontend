"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { formatInteger } from "@/lib/format";

const DURATION_MS = 900;

/** Fast out of the gate, slow into the answer — the same curve as ease-out-soft,
 *  so a figure settling matches everything else that settles in the console. */
function easeOut(t: number): number {
  return 1 - (1 - t) ** 3;
}

/**
 * A whole number that counts up to itself.
 *
 * Used for the headline figures on the dashboards, where the count arriving is
 * the page's one moment — and only there. A figure inside a table or beside a
 * label is being compared, not announced, and a number that is briefly wrong
 * while it animates is worse than useless in a column.
 *
 * It counts from whatever is currently on screen rather than from zero, so a
 * poll that nudges 812 to 814 tweens those two rather than replaying the whole
 * climb. `formatInteger` runs on every frame, which keeps the separators right
 * as the digits grow.
 */
export function CountUp({ value }: { value: number }) {
  // Zero, not the value: the climb from nothing is the whole point on first
  // mount, and starting there is also what makes this safe to render on the
  // server — the first client frame paints the same zero, then animates.
  const [shown, setShown] = useState(0);
  // What the last frame painted, read by the next animation without making it
  // an effect dependency — depending on `shown` would restart on every frame.
  const painted = useRef(0);
  const still = usePrefersReducedMotion();

  /**
   * An effect for the right reason: requestAnimationFrame is an external
   * system, not state being copied from somewhere else.
   *
   * Nothing is scheduled at all when the reader has asked for less motion —
   * the render below simply prints the answer, so there is no state to correct
   * from in here.
   */
  useEffect(() => {
    const from = painted.current;
    if (still || from === value) return;

    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / DURATION_MS, 1);
      const next = Math.round(from + (value - from) * easeOut(progress));
      painted.current = next;
      setShown(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [still, value]);

  // The real figure is always in the DOM for a screen reader, which should be
  // told the answer once rather than read a number that is still moving.
  return (
    <>
      <span aria-hidden>{formatInteger(still ? value : shown)}</span>
      <span className="sr-only">{formatInteger(value)}</span>
    </>
  );
}
