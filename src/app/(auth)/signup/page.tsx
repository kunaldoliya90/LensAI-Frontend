import type { Metadata } from "next";
import { SignupForm } from "@/features/auth/components/SignupForm";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a LensAI tenant and its first user.",
};

export default function SignupPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-ink-muted">
          This creates your tenant and its first user. API keys are issued from the console and
          authenticate once a LensAI administrator approves them.
        </p>
      </div>

      <SignupForm />
    </div>
  );
}
