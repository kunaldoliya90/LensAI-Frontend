import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

let media: MediaQueryList | undefined;

/** Lazy, because the module is imported on the server too. Cached, because
 *  getSnapshot runs on every render and matchMedia is not free. */
function query(): MediaQueryList {
  media ??= window.matchMedia(QUERY);
  return media;
}

/**
 * Whether the reader has asked for less motion.
 *
 * CSS handles this on its own wherever the motion is CSS — see the
 * `prefers-reduced-motion` block in `globals.css`. This is for the two places
 * where the motion is JavaScript and there is nothing for that block to switch
 * off: the landing hero's authored run loop, and the dashboards' counting
 * figures. Both have to not start rather than run instantly.
 *
 * An external store rather than an effect that copies the media query into
 * state: there is nothing to synchronise here, only something to read, and
 * `getServerSnapshot` keeps the server and the first client render agreeing.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function subscribe(listener: () => void): () => void {
  const media = query();
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

function getSnapshot(): boolean {
  return query().matches;
}

/** No motion preference exists on the server, and claiming one would make the
 *  first client render disagree with the markup it is hydrating. */
function getServerSnapshot(): boolean {
  return false;
}
