import type { Permission, SessionResponse, UserRole } from "@/lib/api/types";

/**
 * Browser-held credentials.
 *
 * The API sets no cookies and issues no refresh token, so both credentials live
 * in `sessionStorage` and are read straight from there. They are exposed as
 * external stores rather than React state because the API client — which is not
 * a component — has to read them too.
 */

const SESSION_KEY = "lensai.session";
const PLAYGROUND_KEY = "lensai.playgroundApiKey";

/** Sign out this far before the JWT actually expires, so no call races it. */
const LOGOUT_LEAD_MS = 60_000;

export interface Session {
  accessToken: string;
  tokenType: string;
  expiresAt: number;
  tenantId: string;
  userId: string;
  email: string;
  role: UserRole;
  /** Empty for a USER. Re-sent on every login, so it never drifts from what
   * the API would actually enforce — see `has_permission` below. */
  permissions: Permission[];
}

/** SUPER_ADMIN holds every scope implicitly; the API never bothers sending
 * the list for one, so this is the one place that has to know that. */
export function hasPermission(session: Session | null, permission: Permission): boolean {
  if (!session) return false;
  return session.role === "SUPER_ADMIN" || session.permissions.includes(permission);
}

export function isStaff(session: Session | null): boolean {
  return session?.role === "ADMIN" || session?.role === "SUPER_ADMIN";
}

interface BrowserStore<T> {
  subscribe: (listener: () => void) => () => void;
  get: () => T | null;
  set: (value: T) => void;
  clear: () => void;
}

function createStore<T>(storageKey: string, parse: (raw: string) => T | null): BrowserStore<T> {
  const listeners = new Set<() => void>();
  // getSnapshot must return a stable reference for an unchanged value, or
  // useSyncExternalStore re-renders forever.
  let cachedRaw: string | null = null;
  let cachedValue: T | null = null;

  const read = (): T | null => {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(storageKey);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedValue = raw === null ? null : parse(raw);
    }
    return cachedValue;
  };

  const notify = () => listeners.forEach((listener) => listener());

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    get: read,
    set: (value) => {
      window.sessionStorage.setItem(
        storageKey,
        typeof value === "string" ? value : JSON.stringify(value),
      );
      notify();
    },
    clear: () => {
      window.sessionStorage.removeItem(storageKey);
      notify();
    },
  };
}

const store = createStore<Session>(SESSION_KEY, (raw) => {
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
});

let expiryTimer: ReturnType<typeof setTimeout> | undefined;

function armExpiry(session: Session | null): void {
  clearTimeout(expiryTimer);
  if (!session) return;
  const delay = session.expiresAt - LOGOUT_LEAD_MS - Date.now();
  expiryTimer = setTimeout(() => store.clear(), Math.max(delay, 0));
}

export const sessionStore = {
  subscribe: store.subscribe,
  get: store.get,
  clear: () => {
    clearTimeout(expiryTimer);
    store.clear();
  },
  start: (response: SessionResponse): Session => {
    const session: Session = {
      accessToken: response.access_token,
      tokenType: response.token_type,
      expiresAt: Date.now() + response.expires_in * 1000,
      tenantId: response.tenant_id,
      userId: response.user_id,
      email: response.email,
      role: response.role,
      permissions: response.permissions,
    };
    store.set(session);
    armExpiry(session);
    return session;
  },
};

export const playgroundKeyStore = createStore<string>(PLAYGROUND_KEY, (raw) => raw);

// A reload does not go through start(), so the timer is re-armed on first
// import in the browser. No-op on the server, where there is no storage.
if (typeof window !== "undefined") {
  armExpiry(store.get());
}
