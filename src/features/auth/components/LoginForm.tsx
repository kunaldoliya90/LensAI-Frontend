"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { sessionStore } from "@/lib/auth/session";
import { login } from "../api/session";
import { safeNext } from "../safeNext";
import { loginSchema, type LoginInput } from "../schemas";

export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [error, setError] = useState<unknown>(null);

  const { register, handleSubmit, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      sessionStore.start(await login(values));
      router.replace(next);
    } catch (cause) {
      setError(cause);
    }
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {error ? <ErrorNotice error={error} title="Could not sign in" /> : null}

      <Input
        label="Work email"
        type="email"
        autoComplete="email"
        required
        error={formState.errors.email?.message}
        {...register("email")}
      />

      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        error={formState.errors.password?.message}
        {...register("password")}
      />

      <Button type="submit" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-sm text-ink-muted">
        No account yet?{" "}
        <Link href="/signup" className="text-accent-bright underline underline-offset-2">
          Create one
        </Link>
        . There is no password reset — LensAI has no endpoint for it, so ask an administrator if you
        are locked out.
      </p>
    </form>
  );
}
