"use client";

import { useSyncExternalStore } from "react";
import { playgroundKeyStore, sessionStore, type Session } from "./session";

/** Null on the server and until the browser store has been read. */
export function useSession(): Session | null {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.get, () => null);
}

export function usePlaygroundApiKey(): string | null {
  return useSyncExternalStore(playgroundKeyStore.subscribe, playgroundKeyStore.get, () => null);
}
