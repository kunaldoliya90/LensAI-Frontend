"use client";

import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CONTROL_CLASS, describedBy, Field } from "./Field";

type TextareaProps = ComponentPropsWithRef<"textarea"> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  mono?: boolean;
};

export function Textarea({ label, hint, error, mono, id, className, ...rest }: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  return (
    <Field id={textareaId} label={label} hint={hint} error={error} required={rest.required}>
      <textarea
        id={textareaId}
        className={cn(CONTROL_CLASS, mono && "font-mono text-[13px]", className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(textareaId, hint, error)}
        {...rest}
      />
    </Field>
  );
}
