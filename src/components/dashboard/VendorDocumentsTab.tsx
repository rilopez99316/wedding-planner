"use client";

import { useRef, useState } from "react";
import type { VendorDocument } from "@prisma/client";
import { addVendorDocumentAction, deleteVendorDocumentAction } from "@/lib/actions/vendors";
import { formatDate } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface VendorDocumentsTabProps {
  vendorId:  string;
  documents: VendorDocument[];
  onChange:  (docs: VendorDocument[]) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

type IconKind = "pdf" | "doc" | "image" | "file";

function fileIconKind(fileType: string): IconKind {
  if (fileType === "application/pdf") return "pdf";
  if (fileType.startsWith("image/")) return "image";
  if (fileType.includes("word") || fileType.includes("document")) return "doc";
  return "file";
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Icons ──────────────────────────────────────────────────────────────────

function PdfIcon() {
  return (
    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function FileTypeIcon({ kind }: { kind: IconKind }) {
  if (kind === "pdf")   return <PdfIcon />;
  if (kind === "doc")   return <DocIcon />;
  if (kind === "image") return <ImageIcon />;
  return <FileIcon />;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function VendorDocumentsTab({ vendorId, documents, onChange }: VendorDocumentsTabProps) {
  const fileInputRef             = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [deletingId, setDeletingId]   = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/vendor-doc", {
        method: "POST",
        body:   formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");

      const doc = await addVendorDocumentAction(
        vendorId,
        file.name,
        json.url,
        file.type,
        file.size
      );

      onChange([...documents, doc]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      // Reset so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteVendorDocumentAction(id);
      onChange(documents.filter((d) => d.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full py-3 rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-accent hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <svg className="w-4 h-4 animate-spin text-accent" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Uploading…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Attach document
            </>
          )}
        </button>
        <p className="text-[11px] text-gray-400 mt-1.5 text-center">PDF, Word, or image · up to 20 MB</p>
      </div>

      {/* Error */}
      {uploadError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{uploadError}</p>
      )}

      {/* Document list */}
      {documents.length === 0 ? (
        <div className="py-8 text-center">
          <svg className="w-8 h-8 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <p className="text-sm text-gray-400">No documents attached yet.</p>
          <p className="text-xs text-gray-300 mt-0.5">Contracts, quotes, and proposals live here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const kind = fileIconKind(doc.fileType);
            return (
              <div
                key={doc.id}
                className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5 group"
              >
                {/* Icon */}
                <div className="shrink-0">
                  <FileTypeIcon kind={kind} />
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-800 truncate">{doc.name}</p>
                  <p className="text-[11px] text-gray-400">
                    {formatDate(doc.createdAt)}
                    {doc.fileSize ? ` · ${formatFileSize(doc.fileSize)}` : ""}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View / download"
                    className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-accent hover:bg-accent-light transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <button
                    type="button"
                    title="Delete"
                    disabled={deletingId === doc.id}
                    onClick={() => handleDelete(doc.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    {deletingId === doc.id ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
