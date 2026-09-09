import { cn } from "@/lib/cn";
import { CopyButton } from "./CopyButton";

/** An identifier the reader will need to paste somewhere: shown in full, copyable. */
export function CopyValue({
  value,
  copyLabel,
  className,
  truncate,
}: {
  value: string;
  copyLabel?: string;
  className?: string;
  truncate?: boolean;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5">
      <code
        className={cn(
          "font-mono text-[12px] text-ink",
          truncate && "block max-w-[18ch] overflow-hidden text-ellipsis whitespace-nowrap",
          className,
        )}
        title={truncate ? value : undefined}
      >
        {value}
      </code>
      <CopyButton value={value} label={copyLabel} />
    </span>
  );
}
