"use client";

import { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { addWeddingPartyMemberAction, updateWeddingPartyMemberAction } from "@/lib/actions/wedding-party";
import { WeddingPartyMember, WeddingPartyRole, WeddingPartySide } from "@prisma/client";
import { ROLE_LABEL, ROLE_ICON } from "./WeddingPartyMemberCard";

const ROLES: WeddingPartyRole[] = [
  "MOH", "BRIDESMAID", "BEST_MAN", "GROOMSMAN",
  "FLOWER_GIRL", "RING_BEARER", "PARENT_OF_BRIDE", "PARENT_OF_GROOM",
  "OFFICIANT", "OTHER",
];

const SIDES: { value: WeddingPartySide; label: string }[] = [
  { value: "BRIDE", label: "Bride's" },
  { value: "GROOM", label: "Groom's" },
  { value: "BOTH",  label: "Both" },
];

interface AddWeddingPartyMemberDialogProps {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  editingMember: WeddingPartyMember | null;
  onSuccess:     (member: WeddingPartyMember) => void;
}

export default function AddWeddingPartyMemberDialog({
  open,
  onOpenChange,
  editingMember,
  onSuccess,
}: AddWeddingPartyMemberDialogProps) {
  const isEditMode = !!editingMember;

  const [photoUrl,     setPhotoUrl]     = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError,   setPhotoError]   = useState("");
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const [name,     setName]     = useState("");
  const [role,     setRole]     = useState<WeddingPartyRole>("BRIDESMAID");
  const [side,     setSide]     = useState<WeddingPartySide>("BRIDE");
  const [email,    setEmail]    = useState("");
  const [phone,    setPhone]    = useState("");
  const [notes,    setNotes]    = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const [showOptional, setShowOptional] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate on open / reset
  useEffect(() => {
    if (editingMember) {
      setPhotoUrl(editingMember.photoUrl ?? null);
      setName(editingMember.name);
      setRole(editingMember.role);
      setSide(editingMember.side);
      setEmail(editingMember.email ?? "");
      setPhone(editingMember.phone ?? "");
      setNotes(editingMember.notes ?? "");
      setIsPublic(editingMember.isPublic);
      // Expand optional if any optional field is populated
      setShowOptional(
        !!(editingMember.email || editingMember.phone || editingMember.notes)
      );
    } else {
      setPhotoUrl(null);
      setName("");
      setRole("BRIDESMAID");
      setSide("BRIDE");
      setEmail("");
      setPhone("");
      setNotes("");
      setIsPublic(true);
      setShowOptional(false);
    }
    setPhotoError("");
    setError("");
    setPhotoLoading(false);
  }, [editingMember, open]);

  async function uploadFile(file: File) {
    setPhotoError("");
    setPhotoLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload?type=party_member", {
        method: "POST",
        body:   formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setPhotoUrl(json.url);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setPhotoLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const payload = {
      name:     name.trim(),
      role,
      side,
      photoUrl: photoUrl || null,
      email:    email.trim() || null,
      phone:    phone.trim() || null,
      notes:    notes.trim() || null,
      isPublic,
    };

    setLoading(true);
    try {
      let member: WeddingPartyMember;
      if (isEditMode && editingMember) {
        member = await updateWeddingPartyMemberAction(editingMember.id, payload);
      } else {
        member = await addWeddingPartyMemberAction(payload);
      }
      onSuccess(member);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function getInitials(n: string) {
    const parts = n.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Backdrop */}
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
              />
            </Dialog.Overlay>

            {/* Dialog */}
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 8 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed inset-0 flex items-center justify-center z-50 p-4"
              >
                <div className="bg-white rounded-xl shadow-apple-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <Dialog.Title className="text-[15px] font-semibold text-gray-900">
                      {isEditMode ? `Edit ${editingMember?.name}` : "Add party member"}
                    </Dialog.Title>
                    <Dialog.Close className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Dialog.Close>
                  </div>

                  {/* Scrollable body */}
                  <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
                    <div className="px-6 py-5 flex flex-col gap-6">

                      {/* ── Photo upload ─────────────────────────────────── */}
                      <div className="flex flex-col items-center gap-3">
                        {/* Preview / drop zone */}
                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                          onDragLeave={() => setIsDraggingOver(false)}
                          onDrop={handleDrop}
                          onClick={() => !photoLoading && fileInputRef.current?.click()}
                          className={cn(
                            "relative w-24 h-24 rounded-full cursor-pointer transition-all duration-200",
                            "ring-2 ring-offset-2",
                            isDraggingOver
                              ? "ring-accent scale-105 bg-accent-light"
                              : "ring-gray-200 hover:ring-accent"
                          )}
                        >
                          {photoLoading ? (
                            <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                              <Spinner size="sm" />
                            </div>
                          ) : photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photoUrl}
                              alt="Preview"
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full rounded-full bg-gray-100 flex flex-col items-center justify-center gap-1">
                              {name ? (
                                <span className="text-xl font-semibold text-gray-400">{getInitials(name)}</span>
                              ) : (
                                <>
                                  <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span className="text-[10px] text-gray-300">Photo</span>
                                </>
                              )}
                            </div>
                          )}

                          {/* Remove button */}
                          {photoUrl && !photoLoading && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setPhotoUrl(null); }}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full shadow-apple-sm border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400">
                          {photoLoading ? "Uploading…" : "Click or drag a photo · JPEG, PNG, WebP · max 10MB"}
                        </p>
                        {photoError && (
                          <p className="text-xs text-red-600">{photoError}</p>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </div>

                      {/* ── Name ─────────────────────────────────────────── */}
                      <div>
                        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                          Full name <span className="text-red-400">*</span>
                        </label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Jane Smith"
                          required
                        />
                      </div>

                      {/* ── Role ─────────────────────────────────────────── */}
                      <div>
                        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                          Role <span className="text-red-400">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {ROLES.map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setRole(r)}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium border transition-all text-left",
                                role === r
                                  ? "border-accent bg-accent-light text-accent"
                                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                              )}
                            >
                              <span>{ROLE_ICON[r]}</span>
                              <span>{ROLE_LABEL[r]}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ── Side ─────────────────────────────────────────── */}
                      <div>
                        <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                          Side <span className="text-red-400">*</span>
                        </label>
                        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                          {SIDES.map((s, i) => (
                            <button
                              key={s.value}
                              type="button"
                              onClick={() => setSide(s.value)}
                              className={cn(
                                "flex-1 py-2 text-[13px] font-medium transition-colors",
                                i > 0 && "border-l border-gray-200",
                                side === s.value
                                  ? "bg-accent text-white"
                                  : "bg-white text-gray-600 hover:bg-gray-50"
                              )}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ── Optional details (collapsible) ───────────────── */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowOptional((v) => !v)}
                          className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <svg
                            className={cn("w-3.5 h-3.5 transition-transform", showOptional && "rotate-90")}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                          Optional details
                        </button>

                        <AnimatePresence initial={false}>
                          {showOptional && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-4 flex flex-col gap-4">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Email</label>
                                    <Input
                                      type="email"
                                      value={email}
                                      onChange={(e) => setEmail(e.target.value)}
                                      placeholder="jane@example.com"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Phone</label>
                                    <Input
                                      value={phone}
                                      onChange={(e) => setPhone(e.target.value)}
                                      placeholder="+1 (555) 000-0000"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Notes</label>
                                  <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Dress size, travel arrangements, dietary preferences…"
                                    rows={3}
                                    className="w-full px-3 py-2 text-[14px] bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none placeholder-gray-400 text-gray-900"
                                  />
                                </div>

                                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={isPublic}
                                    onChange={(e) => setIsPublic(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                                  />
                                  <span className="text-[13px] text-gray-700">Show on public wedding page</span>
                                </label>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Error */}
                      {error && (
                        <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 shrink-0">
                      <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" disabled={loading || !name.trim()}>
                        {loading ? <Spinner size="sm" /> : isEditMode ? "Save changes" : "Add member"}
                      </Button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
