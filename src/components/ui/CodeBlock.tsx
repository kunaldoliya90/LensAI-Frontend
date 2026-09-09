import { cn } from "@/lib/cn";
import { CopyButton } from "./CopyButton";

export function CodeBlock({
  children,
  language = "text",
  tone = "light",
  className,
}: {
  children: string;
  language?: string;
  /** `deep` for code sitting on an inverted section. */
  tone?: "light" | "deep";
  className?: string;
}) {
  const deep = tone === "deep";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border",
        deep ? "border-white/10 bg-deep-2" : "border-line bg-code",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b px-3 py-2",
          deep ? "border-white/10 bg-white/[0.03]" : "border-line",
        )}
      >
        <span
          className={cn(
            "font-mono text-[11px] tracking-wide uppercase",
            deep ? "text-ink-muted" : "text-ink-subtle",
          )}
        >
          {language}
        </span>
        <CopyButton value={children} tone={tone} />
      </div>

      <pre
        className={cn(
          "overflow-x-auto px-3 py-3 text-[12.5px] leading-relaxed",
          deep && "text-ink",
        )}
      >
        <code className="font-mono">{children}</code>
      </pre>
    </div>
  );
}
