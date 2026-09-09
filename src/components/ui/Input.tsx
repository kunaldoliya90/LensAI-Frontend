"use client";

import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CONTROL_CLASS, describedBy, Field } from "./Field";

type InputProps = ComponentPropsWithRef<"input"> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  mono?: boolean;
};

export function Input({ label, hint, error, mono, id, className, ...rest }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field id={inputId} label={label} hint={hint} error={error} required={rest.required}>
      <input
        id={inputId}
        className={cn(CONTROL_CLASS, mono && "font-mono text-[13px]", className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(inputId, hint, error)}
        {...rest}
      />
    </Field>
  );
}
