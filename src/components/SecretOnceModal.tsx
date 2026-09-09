"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { CopyButton } from "@/components/ui/CopyButton";
import { Modal } from "@/components/ui/Modal";

/**
 * The one presentation of a secret LensAI will never show again — API keys and
 * webhook signing secrets both. Not dismissible, and the acknowledgement is a
 * deliberate blocker: closing this dialog is the moment the secret is gone.
 */
export function SecretOnceModal({
  open,
  onDone,
  title,
  description,
  secret,
  downloadName,
  children,
}: {
  open: boolean;
  onDone: () => void;
  title: string;
  description: ReactNode;
  secret: string;
  downloadName: string;
  children?: ReactNode;
}) {
  const [acknowledged, setAcknowledged] = useState(false);

  const download = () => {
    const url = URL.createObjectURL(new Blob([secret], { type: "text/plain" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = downloadName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const finish = () => {
    setAcknowledged(false);
    onDone();
  };

  return (
    <Modal
      open={open}
      onClose={finish}
      dismissible={false}
      title={title}
      description={description}
      footer={
        <Button disabled={!acknowledged} onClick={finish}>
          Done
        </Button>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-2">
          <div className="flex items-start gap-2 rounded-md border border-line bg-surface p-3">
            <code className="min-w-0 flex-1 font-mono text-[13px] break-all text-ink">{secret}</code>
            <CopyButton value={secret} />
          </div>
          <div>
            <Button variant="secondary" size="sm" onClick={download}>
              Download .txt
            </Button>
          </div>
        </div>

        {children}

        <Checkbox
          checked={acknowledged}
          onChange={(event) => setAcknowledged(event.target.checked)}
          label="I have stored this secret. LensAI cannot show it again."
        />
      </div>
    </Modal>
  );
}
