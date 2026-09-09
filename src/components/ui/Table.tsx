import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** The white panel a table sits in. Dense tables scroll sideways on a phone. */
export function TableScroll({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("panel overflow-x-auto", className)}>
      {children}
    </div>
  );
}

export function Table({ className, ...rest }: ComponentPropsWithoutRef<"table">) {
  return <table className={cn("w-full border-collapse text-[12.5px]", className)} {...rest} />;
}

export function Th({ className, ...rest }: ComponentPropsWithoutRef<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-line px-4 py-2.5 text-left font-mono text-[10px] font-normal tracking-[0.08em] whitespace-nowrap text-ink-subtle uppercase",
        className,
      )}
      {...rest}
    />
  );
}

export function Tr({ className, ...rest }: ComponentPropsWithoutRef<"tr">) {
  return (
    <tr
      className={cn(
        "border-b border-line transition-[background-color,box-shadow] last:border-b-0",
        "hover:bg-surface-strong hover:shadow-[inset_2px_0_0_var(--color-accent)]",
        className,
      )}
      {...rest}
    />
  );
}

export function Td({ className, ...rest }: ComponentPropsWithoutRef<"td">) {
  return <td className={cn("px-4 py-2.5 align-middle", className)} {...rest} />;
}

/** A single full-width row for the loading, empty and error states of a table. */
export function TableMessage({
  columns,
  children,
  tone = "muted",
}: {
  columns: number;
  children: ReactNode;
  tone?: "muted" | "error";
}) {
  return (
    <tr>
      <td
        colSpan={columns}
        className={cn(
          "px-4 py-10 text-center text-[13px]",
          tone === "error" ? "text-fail" : "text-ink-muted",
        )}
      >
        {children}
      </td>
    </tr>
  );
}
