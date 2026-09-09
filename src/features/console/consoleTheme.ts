export type ConsoleTheme = "neon" | "porcelain";

export const CONSOLE_THEME_LABEL: Record<ConsoleTheme, string> = {
  neon: "Neon",
  porcelain: "Porcelain",
};

const STORAGE_KEY = "lensai.consoleTheme";
const DEFAULT_THEME: ConsoleTheme = "neon";

/**
 * Which ground the console paints.
 *
 * `localStorage` rather than component state, because the choice has to survive
 * a reload, and an external store rather than a `useEffect` that copies storage
 * into state — there is nothing to synchronise, only something to read. The
 * shell reads it with `useSyncExternalStore`.
 *
 * There is no flash of the wrong ground to guard against: `ConsoleShell`
 * renders nothing until the session store has been read, which is already after
 * hydration, so the first paint of the console is the first paint that sees
 * real storage.
 */
const listeners = new Set<() => void>();

/**
 * A string, so the snapshot is referentially stable without caching it.
 *
 * Only "porcelain" is recognised, so any earlier value this key used to hold
 * resolves to the default rather than to a ground that no longer exists — no
 * migration step, and nobody is left on a ground they cannot name. A browser
 * still holding "indigo" from before Neon replaced it opens on Neon, which is
 * what that reader should be seeing anyway.
 */
function read(): ConsoleTheme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  return window.localStorage.getItem(STORAGE_KEY) === "porcelain" ? "porcelain" : DEFAULT_THEME;
}

export const consoleThemeStore = {
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  get: read,
  getServerSnapshot: (): ConsoleTheme => DEFAULT_THEME,
  toggle: () => {
    window.localStorage.setItem(STORAGE_KEY, read() === "neon" ? "porcelain" : "neon");
    listeners.forEach((listener) => listener());
  },
};
