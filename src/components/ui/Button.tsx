import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md border font-medium whitespace-nowrap transition-[background-color,border-color,box-shadow,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50";

const VARIANTS: Record<Variant, string> = {
  // btn-primary is where the gradient fill, the cast and the shine that
    // crosses it on hover live — all three are ground-dependent, and outside the
    // console the tokens behind them are unset, so a marketing button keeps the
    // flat indigo it always had and gains only the sweep.
    primary:
      "btn-primary border-btn bg-btn text-btn-fg hover:border-btn-hover hover:bg-btn-hover hover:shadow-sm",
  secondary:
    "border-line-strong bg-ground text-ink shadow-xs hover:border-ink-subtle/40 hover:bg-surface",
  ghost: "border-transparent text-ink-muted hover:bg-surface hover:text-ink",
  danger: "border-fail bg-fail text-white shadow-xs hover:opacity-90",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-5 text-[15px]",
};

/** For links that must look like buttons, so `<Link>` keeps its own semantics. */
export function buttonClass(options?: { variant?: Variant; size?: Size; className?: string }) {
  return cn(
    BASE,
    VARIANTS[options?.variant ?? "primary"],
    SIZES[options?.size ?? "md"],
    options?.className,
  );
}

type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: Variant;
  size?: Size;
};

export function Button({ variant, size, className, type, ...rest }: ButtonProps) {
  // Buttons outside a form are the common case here; an explicit "submit" is
  // less surprising than a default that submits whichever form it lands in.
  return (
    <button type={type ?? "button"} className={buttonClass({ variant, size, className })} {...rest} />
  );
}
