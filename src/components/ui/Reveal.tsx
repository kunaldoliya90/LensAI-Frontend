"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Fades and lifts a block the first time it scrolls into view.
 *
 * The hiding class is applied by this effect rather than in the markup, and
 * only to blocks that start below the fold. Putting `opacity: 0` in the
 * server-rendered HTML would mean any reader whose JavaScript failed — or any
 * crawler that does not run it — got a page of empty sections.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  /** Milliseconds, for staggering a row of cards. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    // Already on screen at load: showing it is the whole job, and animating
    // something the reader is looking at just delays them.
    if (element.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    element.classList.add("reveal");
    element.style.transitionDelay = `${delay}ms`;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        element.classList.add("is-visible");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
