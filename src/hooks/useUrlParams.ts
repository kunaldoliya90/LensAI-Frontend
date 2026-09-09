"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Filters, selected rows and the open record belong in the URL: they survive a
 * reload, they are shareable, and they do not need a second copy in React state.
 */
export function useUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return { params, setParams };
}

/**
 * A query string is user input. These narrow a raw param to a value the API
 * will accept, rather than forwarding whatever was typed into the URL bar.
 */
export function oneOf<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function numberIn(value: string | null, allowed: readonly number[], fallback: number): number {
  const parsed = Number(value);
  return allowed.includes(parsed) ? parsed : fallback;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function dateParam(value: string | null, fallback: string): string {
  return value && ISO_DATE.test(value) ? value : fallback;
}
