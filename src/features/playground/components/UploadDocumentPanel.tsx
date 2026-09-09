"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Button } from "@/components/ui/Button";
import { CopyValue } from "@/components/ui/CopyValue";
import { Input } from "@/components/ui/Input";
import { Table, TableScroll, Td, Th, Tr } from "@/components/ui/Table";
import { Timestamp } from "@/components/ui/Timestamp";
import { formatBytes } from "@/lib/format";
import type { DocumentUploaded } from "@/lib/api/types";
import { uploadDocument } from "../api/playground";

const ACCEPT = "application/pdf,image/png,image/jpeg,image/webp";

export function UploadDocumentPanel({
  apiKey,
  clientId,
  uploads,
  onUploaded,
}: {
  apiKey: string;
  clientId: string;
  uploads: DocumentUploaded[];
  onUploaded: (document: DocumentUploaded) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("");
  // A file input cannot be cleared by setting a value, so it is remounted —
  // only after a successful upload, never while the user is choosing.
  const [uploadCount, setUploadCount] = useState(0);

  const upload = useMutation({
    mutationFn: uploadDocument,
    onSuccess: (document) => {
      onUploaded(document);
      setFile(null);
      setUploadCount((count) => count + 1);
    },
  });

  return (
    <section className="panel p-4">
      <h2 className="text-[12.5px] font-medium">Upload a document</h2>
      <p className="mt-1 max-w-3xl text-[13px] text-ink-muted">
        PDF, PNG, JPEG or WebP, up to 50 MB. The format is decided from the file&rsquo;s own leading
        bytes, so a mislabelled extension is refused here rather than mid-job.
      </p>

      <div className="mt-4 grid gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-64 flex-1">
            <Input
              key={uploadCount}
              label="File"
              type="file"
              accept={ACCEPT}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
          <div className="w-48">
            <Input
              label="doc_type"
              placeholder="challan"
              hint="Optional label."
              value={docType}
              onChange={(event) => setDocType(event.target.value)}
            />
          </div>
          <Button
            disabled={!file || upload.isPending}
            onClick={() =>
              file &&
              upload.mutate({ apiKey, clientId, file, docType: docType.trim() || undefined })
            }
          >
            {upload.isPending ? "Uploading…" : "Upload"}
          </Button>
        </div>

        {upload.isError ? <ErrorNotice error={upload.error} title="Upload failed" /> : null}

        {uploads.length > 0 ? (
          <TableScroll>
            <Table className="min-w-[52rem]">
              <thead>
                <Tr>
                  <Th>File</Th>
                  <Th>document_id</Th>
                  <Th>Type</Th>
                  <Th>Size</Th>
                  <Th>sha256</Th>
                  <Th>Expires</Th>
                </Tr>
              </thead>
              <tbody>
                {uploads.map((document) => (
                  <Tr key={document.document_id}>
                    <Td className="font-medium">{document.file_name}</Td>
                    <Td>
                      <CopyValue value={document.document_id} truncate />
                    </Td>
                    <Td className="font-mono text-[12px]">{document.content_type}</Td>
                    <Td className="text-ink-muted">{formatBytes(document.size_bytes)}</Td>
                    <Td>
                      <CopyValue value={document.sha256} truncate />
                    </Td>
                    <Td className="text-ink-muted">
                      <Timestamp value={document.expires_at} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableScroll>
        ) : null}
      </div>
    </section>
  );
}
