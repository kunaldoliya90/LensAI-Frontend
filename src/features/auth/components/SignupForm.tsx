"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { sessionStore } from "@/lib/auth/session";
import { signup } from "../api/session";
import { signupSchema, type SignupInput } from "../schemas";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<unknown>(null);

  const { register, handleSubmit, formState } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      sessionStore.start(await signup(values));
      router.replace("/app");
    } catch (cause) {
      setError(cause);
    }
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {error ? <ErrorNotice error={error} title="Could not create the account" /> : null}

      <Input
        label="Company name"
        autoComplete="organization"
        required
        hint="This becomes your tenant. Every key, client and verification belongs to it."
        error={formState.errors.company_name?.message}
        {...register("company_name")}
      />

      <Input
        label="Your name"
        autoComplete="name"
        required
        error={formState.errors.name?.message}
        {...register("name")}
      />

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
        autoComplete="new-password"
        required
        hint="At least 12 characters. There is no password reset flow, so store it in your password manager now."
        error={formState.errors.password?.message}
        {...register("password")}
      />

      <Button type="submit" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent-bright underline underline-offset-2">
          Sign in
        </Link>
        .
      </p>
    </form>
  );
}
