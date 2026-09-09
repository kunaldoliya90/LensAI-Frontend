"use client";

import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CONTROL_CLASS, describedBy, Field } from "./Field";

type SelectProps = ComponentPropsWithRef<"select"> & {
  label: string;
  hint?: ReactNode;
  error?: string;
};

export function Select({ label, hint, error, id, className, children, ...rest }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <Field id={selectId} label={label} hint={hint} error={error} required={rest.required}>
      <select
        id={selectId}
        className={cn(CONTROL_CLASS, "appearance-none bg-ground pr-8", className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(selectId, hint, error)}
        {...rest}
      >
        {children}
      </select>
    </Field>
  );
}
