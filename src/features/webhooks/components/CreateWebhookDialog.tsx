"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { WEBHOOK_EVENTS, type WebhookEndpointCreated } from "@/lib/api/types";
import { createWebhook } from "../api/webhooks";

export function CreateWebhookDialog({
  clientId,
  open,
  onClose,
  onCreated,
}: {
  clientId: string;
  open: boolean;
  onClose: () => void;
  onCreated: (created: WebhookEndpointCreated) => void;
}) {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [events, setEvents] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: createWebhook,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["webhooks", clientId] });
      setUrl("");
      setDescription("");
      setEvents([]);
      onCreated(created);
    },
  });

  const toggleEvent = (event: string, checked: boolean) =>
    setEvents((current) =>
      checked ? [...current, event] : current.filter((value) => value !== event),
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Register a webhook endpoint"
      description="The signing secret is returned once, on the next screen."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={url.trim().length === 0 || mutation.isPending}
            onClick={() =>
              mutation.mutate({
                client_id: clientId,
                url: url.trim(),
                description: description.trim() || undefined,
                events,
              })
            }
          >
            {mutation.isPending ? "Registering…" : "Register endpoint"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {mutation.isError ? <ErrorNotice error={mutation.error} /> : null}

        <Input
          label="URL"
          type="url"
          required
          autoFocus
          placeholder="https://acme.example.com/webhooks/lensai"
          hint="An HTTPS URL we POST signed events to. Private, loopback and metadata addresses are refused."
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />

        <Input
          label="Description"
          maxLength={255}
          hint="Optional. Your own note about which system this endpoint belongs to."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />

        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Events</legend>
          <p className="text-[13px] text-ink-muted">
            Leave both unchecked to receive all of them — the sensible default for one URL.
          </p>
          {WEBHOOK_EVENTS.map((event) => (
            <Checkbox
              key={event}
              label={<code className="font-mono text-[13px]">{event}</code>}
              checked={events.includes(event)}
              onChange={(changed) => toggleEvent(event, changed.target.checked)}
            />
          ))}
        </fieldset>

        <Callout tone="neutral">
          Registering an unknown event type is refused rather than silently never delivering — a
          subscription to <code className="font-mono text-[13px]">verification.complete</code>{" "}
          (no &ldquo;d&rdquo;) would otherwise look like a broken platform.
        </Callout>
      </div>
    </Modal>
  );
}
