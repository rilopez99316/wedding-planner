"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import {
  addGiftAction,
  updateGiftAction,
  deleteGiftAction,
  updateThankYouAction,
} from "@/lib/actions/thank-you";
import type { Gift } from "@prisma/client";

// ── Types ─────────────────────────────────────────────────────────────────────

type Category = "cash" | "registry" | "experience" | "other";
type ThankYouStatus = "pending" | "drafted" | "sent";

interface ThankYouClientProps {
  gifts: Gift[];
}

interface FormState {
  guestId: string;
  giverName: string;
  description: string;
  category: string;
  value: string;
  receivedAt: string;
  notes: string;
}

const emptyForm = (): FormState => ({
  guestId: "",
  giverName: "",
  description: "",
  category: "",
  value: "",
  receivedAt: "",
  notes: "",
});

function giftToForm(g: Gift): FormState {
  return {
    guestId: g.guestId ?? "",
    giverName: g.giverName,
    description: g.description,
    category: g.category ?? "",
    value: g.value != null ? String(g.value) : "",
    receivedAt: g.receivedAt ? toDateInputValue(g.receivedAt) : "",
    notes: g.notes ?? "",
  };
}

function formToInput(f: FormState) {
  return {
    guestId: f.guestId || null,
    giverName: f.giverName.trim(),
    description: f.description.trim(),
    category: (f.category as Category) || null,
    value: f.value ? parseFloat(f.value) : null,
    receivedAt: f.receivedAt || null,
    notes: f.notes.trim() || null,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDateInputValue(d: Date): string {
  return new Date(d).toISOString().split("T")[0];
}

function formatDate(d: Date | null): string | null {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_NEXT: Record<ThankYouStatus, ThankYouStatus> = {
  pending: "drafted",
  drafted: "sent",
  sent: "pending",
};

const STATUS_LABEL: Record<ThankYouStatus, string> = {
  pending: "Pending",
  drafted: "Drafted",
  sent: "Sent",
};

const CATEGORY_LABEL: Record<Category, string> = {
  cash: "Cash / Check",
  registry: "Registry Item",
  experience: "Experience",
  other: "Other",
};

const CATEGORY_ICON: Record<Category, string> = {
  cash: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  registry: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  experience: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  other: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
};

// ── Progress Ring ─────────────────────────────────────────────────────────────

function ProgressRing({ sent, total }: { sent: number; total: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? Math.min(1, sent / total) : 0;
  const dash = circumference * pct;

  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <svg width="80" height="80" className="-rotate-90">
        {/* Track */}
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="6" />
        {/* Progress */}
        <motion.circle
          cx="40" cy="40" r={radius}
          fill="none"
          stroke="#0071E3"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - dash }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-bold text-gray-900 leading-none">{sent}</span>
        <span className="text-[10px] text-gray-400 leading-none">/ {total}</span>
      </div>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({
  status,
  onClick,
  loading,
}: {
  status: ThankYouStatus;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={`Click to advance status`}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1 border transition-all duration-150 shrink-0",
        "hover:scale-105 active:scale-95",
        loading && "opacity-60 cursor-wait",
        status === "pending" && "bg-gray-50 border-gray-200 text-gray-500",
        status === "drafted" && "bg-amber-50 border-amber-200 text-amber-700",
        status === "sent"    && "bg-green-50 border-green-200 text-green-700",
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          status === "pending" && "bg-gray-400",
          status === "drafted" && "bg-amber-500",
          status === "sent"    && "bg-green-500",
        )}
      />
      {STATUS_LABEL[status]}
    </button>
  );
}

// ── Gift Icon ─────────────────────────────────────────────────────────────────

function GiftIcon({ category }: { category?: string | null }) {
  const path = category && category in CATEGORY_ICON
    ? CATEGORY_ICON[category as Category]
    : "M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z";

  return (
    <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
      <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
      </svg>
    </div>
  );
}

// ── Gift Form ─────────────────────────────────────────────────────────────────

function GiftForm({
  form,
  onChange,
  onSave,
  onCancel,
  saving,
  error,
  isEdit,
}: {
  form: FormState;
  onChange: (patch: Partial<FormState>) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
  isEdit?: boolean;
}) {
  const field = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent bg-white transition-colors";
  const label = "block text-xs font-medium text-gray-500 mb-1";

  return (
    <div className="p-5 space-y-4">
      <p className="text-sm font-semibold text-gray-800">
        {isEdit ? "Edit Gift" : "Log a Gift"}
      </p>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Row 1: Giver Name */}
      <div>
        <label className={label}>Giver Name <span className="text-red-400">*</span></label>
        <input
          autoFocus={!isEdit}
          value={form.giverName}
          onChange={(e) => onChange({ giverName: e.target.value })}
          placeholder="Sarah & James Kim"
          className={field}
        />
      </div>

      {/* Row 2: Description + Category */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Gift Description <span className="text-red-400">*</span></label>
          <input
            value={form.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="KitchenAid Stand Mixer"
            className={field}
          />
        </div>
        <div>
          <label className={label}>Category <span className="text-gray-400 font-normal">(optional)</span></label>
          <select
            value={form.category}
            onChange={(e) => onChange({ category: e.target.value })}
            className={cn(field, "appearance-none")}
          >
            <option value="">— select —</option>
            <option value="cash">Cash / Check</option>
            <option value="registry">Registry Item</option>
            <option value="experience">Experience</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Row 3: Value + Received Date */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Value <span className="text-gray-400 font-normal">(optional)</span></label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.value}
              onChange={(e) => onChange({ value: e.target.value })}
              placeholder="150"
              className={cn(field, "pl-6")}
            />
          </div>
        </div>
        <div>
          <label className={label}>Date Received <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            type="date"
            value={form.receivedAt}
            onChange={(e) => onChange({ receivedAt: e.target.value })}
            className={field}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={label}>Notes <span className="text-gray-400 font-normal">(optional)</span></label>
        <textarea
          value={form.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={2}
          placeholder="Any details worth remembering…"
          maxLength={500}
          className={cn(field, "resize-none")}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" variant="primary" loading={saving} onClick={onSave}>
          {isEdit ? "Save Changes" : "Log Gift"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Note Writer (inline expand) ───────────────────────────────────────────────

function NoteWriter({
  gift,
  onClose,
}: {
  gift: Gift;
  onClose: () => void;
}) {
  const [note, setNote] = useState(gift.thankYouNote ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textRef.current?.focus();
  }, []);

  async function handleSaveDraft() {
    setSaving(true);
    setError(null);
    try {
      await updateThankYouAction(gift.id, { status: "drafted", thankYouNote: note });
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save note.");
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkSent() {
    setSaving(true);
    setError(null);
    try {
      await updateThankYouAction(gift.id, {
        status: "sent",
        thankYouNote: note,
        thankYouSentAt: new Date().toISOString(),
      });
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-5 pb-4 space-y-3 border-t border-gray-100 pt-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Thank-You Note</p>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <textarea
        ref={textRef}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
        maxLength={2000}
        placeholder={`Dear ${gift.giverName},\n\nThank you so much for the thoughtful gift…`}
        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-accent bg-gray-50 transition-colors resize-none leading-relaxed"
      />

      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant="outline" loading={saving} onClick={handleSaveDraft}>
          Save Draft
        </Button>
        <Button size="sm" variant="primary" loading={saving} onClick={handleMarkSent}>
          Mark as Sent
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        {note.length > 0 && (
          <span className="ml-auto text-[11px] text-gray-400">{note.length}/2000</span>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

type FilterTab = "all" | "pending" | "sent";

export default function ThankYouClient({ gifts: initialGifts }: ThankYouClientProps) {
  const router = useRouter();

  // Local optimistic gift list
  const [gifts, setGifts] = useState<Gift[]>(initialGifts);

  // Sync when server refreshes
  useEffect(() => {
    setGifts(initialGifts);
  }, [initialGifts]);

  // Add form
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm());
  const [savingEditId, setSavingEditId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Status cycling (optimistic)
  const [cyclingId, setCyclingId] = useState<string | null>(null);

  // Note writer expand
  const [noteOpenId, setNoteOpenId] = useState<string | null>(null);

  // Filter tab
  const [filter, setFilter] = useState<FilterTab>("all");

  // ── Stats ────────────────────────────────────────────────────────────────

  const total = gifts.length;
  const sent = gifts.filter((g) => g.thankYouStatus === "sent").length;
  const pending = gifts.filter((g) => g.thankYouStatus !== "sent").length;
  const totalValue = gifts.reduce((s, g) => s + (g.value ?? 0), 0);

  const pendingCount = gifts.filter((g) => g.thankYouStatus === "pending").length;
  const draftedCount = gifts.filter((g) => g.thankYouStatus === "drafted").length;

  // ── Filtered list ────────────────────────────────────────────────────────

  const filtered = gifts.filter((g) => {
    if (filter === "pending") return g.thankYouStatus !== "sent";
    if (filter === "sent")    return g.thankYouStatus === "sent";
    return true;
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleAdd() {
    if (!addForm.giverName.trim()) { setAddError("Giver name is required."); return; }
    if (!addForm.description.trim()) { setAddError("Gift description is required."); return; }
    setSaving(true);
    setAddError(null);
    try {
      await addGiftAction(formToInput(addForm));
      setAdding(false);
      setAddForm(emptyForm());
      router.refresh();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Failed to log gift.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit(id: string) {
    if (!editForm.giverName.trim()) { setEditError("Giver name is required."); return; }
    if (!editForm.description.trim()) { setEditError("Gift description is required."); return; }
    setSavingEditId(id);
    setEditError(null);
    try {
      await updateGiftAction(id, formToInput(editForm));
      setEditingId(null);
      router.refresh();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Failed to update gift.");
    } finally {
      setSavingEditId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this gift from your tracker?")) return;
    setDeletingId(id);
    try {
      await deleteGiftAction(id);
      router.refresh();
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCycleStatus(gift: Gift) {
    const next = STATUS_NEXT[gift.thankYouStatus as ThankYouStatus];
    // Optimistic update
    setGifts((prev) => prev.map((g) => g.id === gift.id ? { ...g, thankYouStatus: next } : g));
    setCyclingId(gift.id);
    try {
      await updateThankYouAction(gift.id, {
        status: next,
        thankYouNote: gift.thankYouNote,
        thankYouSentAt: next === "sent" ? new Date().toISOString() : undefined,
      });
      router.refresh();
    } catch {
      // Revert on failure
      setGifts((prev) => prev.map((g) => g.id === gift.id ? { ...g, thankYouStatus: gift.thankYouStatus } : g));
    } finally {
      setCyclingId(null);
    }
  }

  function startEdit(g: Gift) {
    setEditingId(g.id);
    setEditForm(giftToForm(g));
    setEditError(null);
    setAdding(false);
    setNoteOpenId(null);
  }

  function cancelAdd() {
    setAdding(false);
    setAddForm(emptyForm());
    setAddError(null);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl space-y-6">

      {/* ── Stats bar ── */}
      {total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-apple-sm p-5">
          <div className="flex items-center gap-6">
            {/* Progress ring */}
            <ProgressRing sent={sent} total={total} />

            {/* Divider */}
            <div className="w-px h-16 bg-gray-100" />

            {/* Stats grid */}
            <div className="flex-1 grid grid-cols-3 gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Gifts Received</p>
                <p className="text-2xl font-semibold text-gray-900">{total}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Total Value</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalValue > 0 ? `$${totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Notes Sent</p>
                <div className="flex items-end gap-1.5">
                  <p className="text-2xl font-semibold text-gray-900">{sent}</p>
                  {pending > 0 && (
                    <p className="text-sm text-gray-400 mb-0.5">· {pending} pending</p>
                  )}
                </div>
                {total > 0 && (
                  <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-accent rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round((sent / total) * 100)}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* All-done banner */}
          <AnimatePresence>
            {total > 0 && sent === total && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">All thank-you notes sent!</span>
                <span className="text-green-500">Your guests are going to love hearing from you.</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Filter tabs + Add button ── */}
      <div className="flex items-center justify-between gap-4">
        {total > 0 ? (
          <div className="flex items-center gap-1 bg-white border border-gray-100 shadow-apple-sm rounded-xl p-1">
            {(["all", "pending", "sent"] as FilterTab[]).map((tab) => {
              const count = tab === "all" ? total : tab === "pending" ? pendingCount + draftedCount : sent;
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                    filter === tab
                      ? "bg-accent text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  )}
                >
                  {tab === "all" ? "All" : tab === "pending" ? "Pending" : "Sent"}
                  {count > 0 && (
                    <span
                      className={cn(
                        "text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center leading-none",
                        filter === tab ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div />
        )}

        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            setAddForm(emptyForm());
            setAddError(null);
            setEditingId(null);
            setNoteOpenId(null);
            setAdding(true);
          }}
          disabled={adding}
        >
          + Log Gift
        </Button>
      </div>

      {/* ── Add form ── */}
      <AnimatePresence>
        {adding && (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-apple-md overflow-hidden"
          >
            <GiftForm
              form={addForm}
              onChange={(p) => setAddForm((f) => ({ ...f, ...p }))}
              onSave={handleAdd}
              onCancel={cancelAdd}
              saving={saving}
              error={addError}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty state ── */}
      {total === 0 && !adding && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200"
        >
          <div className="w-16 h-16 rounded-2xl bg-accent-light flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-gray-800 mb-1">Every gift deserves a heartfelt thank-you</p>
          <p className="text-sm text-gray-400 max-w-xs mb-6">
            Log each gift you receive, write personal notes, and track who you&apos;ve thanked.
          </p>
          <Button size="sm" variant="primary" onClick={() => {
            setAddForm(emptyForm());
            setAddError(null);
            setAdding(true);
          }}>
            + Log Your First Gift
          </Button>
        </motion.div>
      )}

      {/* ── No results for filter ── */}
      {total > 0 && filtered.length === 0 && !adding && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200"
        >
          <p className="text-sm font-medium text-gray-500 mb-1">
            {filter === "pending" ? "No pending notes — great work!" : "No sent notes yet."}
          </p>
          <button onClick={() => setFilter("all")} className="text-xs text-accent hover:underline">
            View all gifts
          </button>
        </motion.div>
      )}

      {/* ── Gift cards ── */}
      <AnimatePresence mode="popLayout">
        {filtered.map((gift) => {
          const isEditing = editingId === gift.id;
          const isNoteOpen = noteOpenId === gift.id;
          const status = gift.thankYouStatus as ThankYouStatus;

          return (
            <motion.div
              key={gift.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-apple-md overflow-hidden"
            >
              {isEditing ? (
                <GiftForm
                  form={editForm}
                  onChange={(p) => setEditForm((f) => ({ ...f, ...p }))}
                  onSave={() => handleSaveEdit(gift.id)}
                  onCancel={() => { setEditingId(null); setEditError(null); }}
                  saving={savingEditId === gift.id}
                  error={editError}
                  isEdit
                />
              ) : (
                <>
                  {/* Card body */}
                  <div className="p-5 flex gap-4">
                    {/* Left */}
                    <div className="flex flex-col gap-3 min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <GiftIcon category={gift.category} />
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold text-gray-900 leading-tight truncate">
                            {gift.description}
                          </p>
                          <p className="text-sm text-gray-400 truncate">from {gift.giverName}</p>
                        </div>
                      </div>

                      {/* Info chips */}
                      <div className="flex flex-wrap gap-2">
                        {gift.category && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">
                            {CATEGORY_LABEL[gift.category as Category] ?? gift.category}
                          </span>
                        )}
                        {gift.value != null && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            ${gift.value.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                          </span>
                        )}
                        {gift.receivedAt && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(gift.receivedAt)}
                          </span>
                        )}
                        {status === "sent" && gift.thankYouSentAt && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-2.5 py-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Note sent {formatDate(gift.thankYouSentAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: status + note button */}
                    <div className="flex flex-col items-end justify-between gap-3 shrink-0">
                      <StatusBadge
                        status={status}
                        onClick={() => handleCycleStatus(gift)}
                        loading={cyclingId === gift.id}
                      />
                      <button
                        onClick={() => setNoteOpenId(isNoteOpen ? null : gift.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-1.5 border transition-colors",
                          isNoteOpen
                            ? "bg-accent text-white border-accent"
                            : gift.thankYouNote
                            ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                            : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                        )}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        {gift.thankYouNote ? "View Note" : "Write Note"}
                      </button>
                    </div>
                  </div>

                  {/* Note writer — inline expand */}
                  <AnimatePresence>
                    {isNoteOpen && (
                      <motion.div
                        key="note"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <NoteWriter
                          gift={gift}
                          onClose={() => setNoteOpenId(null)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Footer strip */}
                  <div className="flex items-center justify-between gap-3 px-5 py-2.5 bg-gray-50 border-t border-gray-100">
                    <p className="text-xs text-gray-400 truncate flex-1">
                      {gift.notes ?? ""}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(gift)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(gift.id)}
                        disabled={deletingId === gift.id}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                        title="Delete"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
