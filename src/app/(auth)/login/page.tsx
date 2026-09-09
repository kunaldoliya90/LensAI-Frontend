import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to the LensAI console.",
};

export default function LoginPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Your session lasts an hour and is not refreshed. Sign in again when it ends.
        </p>
      </div>

      <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
