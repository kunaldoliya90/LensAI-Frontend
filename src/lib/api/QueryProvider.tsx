"use client";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { isApiError } from "./errors";

export function QueryProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [client] = useState(() => {
    // A suspended tenant is not a per-page error: every call will fail the same
    // way, so it is handled once here rather than in seventeen components.
    const onError = (error: unknown) => {
      if (isApiError(error) && error.code === "tenant_suspended") {
        router.replace(`/suspended?message=${encodeURIComponent(error.message)}`);
      }
    };

    return new QueryClient({
      queryCache: new QueryCache({ onError }),
      mutationCache: new MutationCache({ onError }),
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          // A 4xx is the caller's fault and will not become a 2xx on retry.
          retry: (failureCount, error) =>
            isApiError(error) && error.status < 500 ? false : failureCount < 2,
        },
        mutations: { retry: false },
      },
    });
  });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
