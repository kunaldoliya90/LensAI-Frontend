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
  return <table className={cn("w-full border-collapse text-[13px] tabular-nums", className)} {...rest} />;
}

export function Th({ className, ...rest }: ComponentPropsWithoutRef<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-line bg-deep-2 px-3.5 py-2.5 text-left text-[12px] font-medium whitespace-nowrap text-ink-subtle",
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
        "hover:bg-deep-2",
        className,
      )}
      {...rest}
    />
  );
}

export function Td({ className, ...rest }: ComponentPropsWithoutRef<"td">) {
  return <td className={cn("px-3.5 py-2.5 align-middle", className)} {...rest} />;
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
