"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "../api/clients";

const schema = z.object({
  name: z.string().trim().min(1, "Give the client a name").max(255),
  contact_email: z.union([z.email("Enter a valid email address"), z.literal("")]),
});

type FormValues = z.infer<typeof schema>;

export function CreateClientDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", contact_email: "" },
  });

  const mutation = useMutation({
    mutationFn: createClient,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
      reset();
      onClose();
    },
  });

  const submit = handleSubmit((values) =>
    mutation.mutateAsync({
      name: values.name,
      contact_email: values.contact_email || undefined,
    }),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a client"
      description="A client is the entity a job belongs to. Every upload, webhook endpoint and verification references its client_id."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create client"}
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
          error={formState.errors.name?.message}
          {...register("name")}
        />

        <Input
          label="Contact email"
          type="email"
          hint="Optional. LensAI does not email this address; it is your own record of who owns the account."
          error={formState.errors.contact_email?.message}
          {...register("contact_email")}
        />
      </form>
    </Modal>
  );
}
