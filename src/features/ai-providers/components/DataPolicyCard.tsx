"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Modal } from "@/components/ui/Modal";
import type { DataPolicy } from "@/lib/api/types";
import { setDataPolicy } from "../api/providers";

export function DataPolicyCard({ current }: { current: DataPolicy }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const mutation = useMutation({
    mutationFn: setDataPolicy,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ai-providers"] });
      setConfirming(false);
    },
  });

  const strict = current === "STRICT";

  return (
    <section className="panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[12.5px] font-medium">
            Data policy
            <StatusPill value={current} label={strict ? "STRICT" : "PLATFORM FALLBACK"} />
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            {strict
              ? "Your documents never reach the platform model. If your provider is unavailable, jobs fail with no_provider_configured and nothing is sent anywhere at all."
              : "If your provider is unavailable, LensAI may process the document with the platform model so the job still completes."}
          </p>
        </div>

        <Button
          variant="secondary"
          disabled={mutation.isPending}
          onClick={() => {
            if (strict) setConfirming(true);
            else mutation.mutate("STRICT");
          }}
        >
          {strict ? "Allow platform fallback" : "Switch back to STRICT"}
        </Button>
      </div>

      {mutation.isError ? (
        <div className="mt-3">
          <ErrorNotice error={mutation.error} title="Could not change the data policy" />
        </div>
      ) : null}

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Allow platform fallback?"
        description="This is a contractual decision and it is recorded against your user."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Keep STRICT
            </Button>
            <Button
              variant="danger"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate("ALLOW_PLATFORM_FALLBACK")}
            >
              {mutation.isPending ? "Switching…" : "Allow fallback"}
            </Button>
          </>
        }
      >
        <Callout tone="warn" title="Documents may reach the platform model">
          With fallback allowed, an outage on your endpoint stops being visible: jobs succeed,
          dashboards stay green, and the guarantee that your documents stay on your own
          infrastructure no longer holds at exactly the moment nobody is watching.
        </Callout>
      </Modal>
    </section>
  );
}
