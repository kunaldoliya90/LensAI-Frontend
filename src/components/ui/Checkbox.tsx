"use client";

import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type CheckboxProps = Omit<ComponentPropsWithRef<"input">, "type"> & { label: ReactNode };

export function Checkbox({ label, id, className, ...rest }: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  return (
    <div className="flex items-start gap-2">
      <input
        id={checkboxId}
        type="checkbox"
        className={cn("mt-0.5 size-4 shrink-0 accent-accent", className)}
        {...rest}
      />
      <label htmlFor={checkboxId} className="text-sm leading-snug text-ink">
        {label}
      </label>
    </div>
  );
}
