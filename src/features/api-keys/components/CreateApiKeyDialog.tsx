"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import type { ApiKeyIssued } from "@/lib/api/types";
import { createApiKey } from "../api/apiKeys";

const schema = z.object({
  name: z.string().trim().min(1, "Give the key a name you will recognise").max(255),
  environment: z.enum(["SANDBOX", "PRODUCTION"]),
});

type FormValues = z.infer<typeof schema>;

export function CreateApiKeyDialog({
  open,
  onClose,
  onIssued,
}: {
  open: boolean;
  onClose: () => void;
  onIssued: (issued: ApiKeyIssued) => void;
}) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", environment: "SANDBOX" },
  });

  const mutation = useMutation({
    mutationFn: createApiKey,
    onSuccess: async (issued) => {
      await queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      reset();
      onIssued(issued);
    },
  });

  const submit = handleSubmit((values) => mutation.mutateAsync(values));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request an API key"
      description="The plaintext key is shown once, on the next screen."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? "Requesting…" : "Request key"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-4" noValidate>
        {mutation.isError ? <ErrorNotice error={mutation.error} /> : null}

        <Input
          label="Name"
          required
          autoFocus
          hint="How you will recognise this key in the list, e.g. “payroll-service (staging)”."
          error={formState.errors.name?.message}
          {...register("name")}
        />

        <Select
          label="Environment"
          required
          hint="An attribute of the key, not a separate deployment. Both reach the same API."
          error={formState.errors.environment?.message}
          {...register("environment")}
        >
          <option value="SANDBOX">SANDBOX</option>
          <option value="PRODUCTION">PRODUCTION</option>
        </Select>

        <Callout tone="warn" title="It will not authenticate immediately">
          The key is created PENDING. Calls made with it return{" "}
          <code className="font-mono text-[13px]">403 api_key_pending_approval</code> until a LensAI
          administrator approves it and assigns a rate-limit tier.
        </Callout>
      </form>
    </Modal>
  );
}
