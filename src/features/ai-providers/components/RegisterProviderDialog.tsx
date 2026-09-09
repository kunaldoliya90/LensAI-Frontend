"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { ProviderAdapter, ProviderRegistered } from "@/lib/api/types";
import { parseJsonObject } from "@/lib/json";
import { registerProvider } from "../api/providers";

const ADAPTERS: { value: ProviderAdapter; label: string; hint: string }[] = [
  {
    value: "azure_openai",
    label: "azure_openai",
    hint: "config.endpoint is the resource URL; model is the deployment name.",
  },
  { value: "openai", label: "openai", hint: "OpenAI itself." },
  {
    value: "openai_compatible",
    label: "openai_compatible",
    hint: "vLLM, Ollama, LiteLLM, Together, Groq, your own gateway. Requires config.base_url.",
  },
];

const DEFAULT_CONFIG = `{
  "endpoint": "https://your-resource.openai.azure.com",
  "api_version": "2025-01-01-preview",
  "timeout_s": 120,
  "max_concurrency": 4
}`;

export function RegisterProviderDialog({
  open,
  onClose,
  onRegistered,
}: {
  open: boolean;
  onClose: () => void;
  onRegistered: (registered: ProviderRegistered) => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [adapter, setAdapter] = useState<ProviderAdapter>("azure_openai");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  const parsed = parseJsonObject(config);

  const mutation = useMutation({
    mutationFn: registerProvider,
    onSuccess: async (registered) => {
      await queryClient.invalidateQueries({ queryKey: ["ai-providers"] });
      setName("");
      setModel("");
      setApiKey("");
      onRegistered(registered);
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Register an AI provider"
      description="LensAI probes the endpoint immediately and reports the result inline."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!parsed.ok || name === "" || model === "" || mutation.isPending}
            onClick={() =>
              parsed.ok &&
              mutation.mutate({
                name: name.trim(),
                adapter,
                model: model.trim(),
                api_key: apiKey.trim() || undefined,
                config: parsed.value,
              })
            }
          >
            {mutation.isPending ? "Registering…" : "Register and probe"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {mutation.isError ? <ErrorNotice error={mutation.error} /> : null}

        <Input
          label="Name"
          required
          autoFocus
          hint="Your label for this endpoint. Templates route by this name, not by id."
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <Select
          label="Adapter"
          required
          hint={ADAPTERS.find((entry) => entry.value === adapter)?.hint}
          value={adapter}
          onChange={(event) => setAdapter(event.target.value as ProviderAdapter)}
        >
          {ADAPTERS.map((entry) => (
            <option key={entry.value} value={entry.value}>
              {entry.label}
            </option>
          ))}
        </Select>

        <Input
          label="Model"
          required
          mono
          hint="Model name, or the deployment name for Azure."
          value={model}
          onChange={(event) => setModel(event.target.value)}
        />

        <Input
          label="API key"
          type="password"
          autoComplete="off"
          hint="Stored in the secret store and never returned. Omit for an endpoint that needs no credential."
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
        />

        <Textarea
          label="Config"
          mono
          rows={8}
          hint="Non-secret connection detail: endpoint or base_url, api_version, timeout_s, max_concurrency, plus declared capabilities (vision, native_json_schema, max_images_per_request, context_tokens)."
          error={parsed.ok ? undefined : parsed.error}
          value={config}
          onChange={(event) => setConfig(event.target.value)}
        />

        <Callout tone="neutral">
          Capability defaults are pessimistic — no vision, no strict JSON schema. A text-only model
          cannot process scans at all, so declare <code className="font-mono text-[13px]">vision</code>{" "}
          if your endpoint supports it.
        </Callout>
      </div>
    </Modal>
  );
}
