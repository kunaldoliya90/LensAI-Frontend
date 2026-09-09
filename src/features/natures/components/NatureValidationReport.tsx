import { Callout } from "@/components/ui/Callout";
import type { NatureValidation } from "@/lib/api/types";

export function NatureValidationReport({ result }: { result: NatureValidation }) {
  return (
    <>
      {result.valid ? (
        <Callout tone="pass" title="Valid">
          Every plugin resolves and every check references a field the extractor produces. This
          config would save.
        </Callout>
      ) : (
        <Callout
          tone="fail"
          title={`${result.problems.length} problem${result.problems.length === 1 ? "" : "s"}`}
        >
          <p>The validator reports every fault at once rather than stopping at the first.</p>
          <ul className="mt-2 list-disc space-y-0.5 pl-5">
            {result.problems.map((problem) => (
              <li key={problem} className="font-mono text-[12.5px]">
                {problem}
              </li>
            ))}
          </ul>
        </Callout>
      )}

      {/* Separate from problems because these do not block the save. A setting
          nothing reads is worth knowing about — it looks like it works. */}
      {result.warnings.length > 0 ? (
        <Callout
          tone="warn"
          title={`${result.warnings.length} setting${result.warnings.length === 1 ? "" : "s"} with no effect`}
        >
          <p>This saves as it is, but these do nothing:</p>
          <ul className="mt-2 list-disc space-y-0.5 pl-5">
            {result.warnings.map((warning) => (
              <li key={warning} className="font-mono text-[12.5px]">
                {warning}
              </li>
            ))}
          </ul>
        </Callout>
      ) : null}
    </>
  );
}
