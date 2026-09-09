export interface DocLink {
  href: string;
  label: string;
  summary: string;
}

export interface DocSection {
  heading: string;
  items: DocLink[];
}

/** One source for the sidebar and the docs hub, so neither can go stale. */
export const DOCS_SECTIONS: DocSection[] = [
  {
    heading: "Start here",
    items: [
      {
        href: "/docs",
        label: "Overview",
        summary: "What LensAI does, and the shape of an integration.",
      },
      {
        href: "/docs/quickstart",
        label: "Quickstart",
        summary: "First key, first upload, first verification — in order.",
      },
      {
        href: "/docs/authentication",
        label: "Authentication",
        summary: "x-api-key for the verification API, a session token for the portal.",
      },
    ],
  },
  {
    heading: "Submitting work",
    items: [
      {
        href: "/docs/uploading",
        label: "Uploading documents",
        summary: "Upload the bytes or pass a URL. Formats, size cap, retention.",
      },
      {
        href: "/docs/verifications",
        label: "Verifications",
        summary: "The submit body, idempotency, and polling versus the webhook.",
      },
      {
        href: "/docs/verdicts",
        label: "Verdicts",
        summary: "job_status versus verdict, and why NOT_SPECIFIED is not a pass.",
      },
    ],
  },
  {
    heading: "Receiving results",
    items: [
      {
        href: "/docs/webhooks",
        label: "Webhooks",
        summary: "Signature verification, the three rules, retries and replay.",
      },
    ],
  },
  {
    heading: "Configuration",
    items: [
      {
        href: "/docs/templates",
        label: "Templates",
        summary: "The config shape, the plugin catalog, and version semantics.",
      },
      {
        href: "/docs/byom",
        label: "Bring your own model",
        summary: "Point LensAI at your own endpoint. STRICT and what it costs.",
      },
    ],
  },
  {
    heading: "Reference",
    items: [
      {
        href: "/docs/errors",
        label: "Errors",
        summary: "The error envelope and every code the API can return.",
      },
      {
        href: "/docs/api-reference",
        label: "API reference",
        summary: "Every route, its credential, and what it returns.",
      },
    ],
  },
];
