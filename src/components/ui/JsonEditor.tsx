"use client";

import { json } from "@codemirror/lang-json";
import CodeMirror from "@uiw/react-codemirror";
import { useId, type ReactNode } from "react";

export function JsonEditor({
  label,
  hint,
  error,
  value,
  onChange,
  height = "26rem",
  readOnly,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  value: string;
  onChange?: (value: string) => void;
  height?: string;
  readOnly?: boolean;
}) {
  const labelId = useId();

  return (
    <div role="group" aria-labelledby={labelId} className="grid gap-1.5">
      <span id={labelId} className="text-sm font-medium text-ink">
        {label}
      </span>
      {hint ? <p className="text-[13px] leading-snug text-ink-muted">{hint}</p> : null}

      <div className="overflow-hidden rounded-md border border-line-strong">
        <CodeMirror
          value={value}
          height={height}
          readOnly={readOnly}
          extensions={[json()]}
          onChange={onChange}
          basicSetup={{ foldGutter: true, highlightActiveLine: !readOnly }}
        />
      </div>

      {error ? (
        <p role="alert" className="text-[13px] text-fail">
          {error}
        </p>
      ) : null}
    </div>
  );
}
