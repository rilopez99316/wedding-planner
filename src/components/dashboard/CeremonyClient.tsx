"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import {
  CEREMONY_ITEM_LABELS,
  CEREMONY_ITEM_COLORS,
  CEREMONY_ITEM_ICONS,
  type CeremonyItemType,
} from "@/lib/ceremony-constants";
import {
  deleteCeremonyItemAction,
  reorderCeremonyItemsAction,
  seedDefaultCeremonyAction,
  updateVowsAction,
  updateMusicAction,
  setVowsPartnerAction,
  setVowsPinAction,
  unlockVowsAction,
  getVowTextIfUnlockedAction,
  resetVowsPinAction,
  lockVowsSessionAction,
} from "@/lib/actions/ceremony";
import AddCeremonyItemDialog, {
  type CeremonyItemRow,
} from "@/components/dashboard/AddCeremonyItemDialog";
import Button from "@/components/ui/Button";

// ── Types ──────────────────────────────────────────────────────────────────

export type CeremonyProgramRow = {
  id:                 string;
  partner1HasPin:     boolean;
  partner2HasPin:     boolean;
  partner1VowsStatus: string;
  partner2VowsStatus: string;
  processionalSong:   string | null;
  recessionalSong:    string | null;
};

type VowStatus = "not_started" | "in_progress" | "ready";

interface CeremonyClientProps {
  program:        CeremonyProgramRow | null;
  initialItems:   CeremonyItemRow[];
  partner1Name:   string;
  partner2Name:   string;
  currentPartner: "partner1" | "partner2" | null;
  weddingId:      string;
}

// ── Shared icons ────────────────────────────────────────────────────────────

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path strokeLinecap="round" d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
    </svg>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "ready") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Ready ✓
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">
        <motion.span
          className="w-1.5 h-1.5 rounded-full bg-amber-500"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        Working on it
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 ring-1 ring-gray-200">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
      Not started
    </span>
  );
}

// ── Partner's vow (sealed view) ────────────────────────────────────────────

function PartnerVowCard({ name, status }: { name: string; status: string }) {
  return (
    <div className="mt-5 pt-5 border-t border-gray-100">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-sm font-bold text-gray-400 shrink-0 shadow-apple-xs">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-gray-700 truncate">{name}</p>
          <p className="text-[11px] text-gray-400">Their vows are sealed</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3.5 py-3 border border-gray-100">
        <span className="text-base shrink-0">💌</span>
        <p className="text-[11px] text-gray-400 italic leading-snug">
          You&apos;ll hear their vows at the altar
        </p>
      </div>
    </div>
  );
}

// ── Your vow card (PIN setup / unlock / editor) ────────────────────────────

function MyVowCard({
  partner,
  name,
  hasPin: hasPinProp,
  onSave,
}: {
  partner:  "partner1" | "partner2";
  name:     string;
  hasPin:   boolean;
  onSave:   (text: string | null, status: VowStatus) => Promise<void>;
}) {
  const [vowText,      setVowText]      = useState<string | null>(null);
  const [unlocked,     setUnlocked]     = useState(false);
  const [hasPin,       setHasPin]       = useState(hasPinProp);
  const [autoChecking, setAutoChecking] = useState(hasPinProp);

  const [pin,          setPin]          = useState("");
  const [pinConfirm,   setPinConfirm]   = useState("");
  const [pinError,     setPinError]     = useState("");
  const [pinLoading,   setPinLoading]   = useState(false);
  const [showForgot,   setShowForgot]   = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [editing,      setEditing]      = useState(false);
  const [draftText,    setDraftText]    = useState("");
  const [status,       setStatus]       = useState<VowStatus>("not_started");
  const [saving,       setSaving]       = useState(false);
  const [saveError,    setSaveError]    = useState("");

  // Auto-unlock on mount if session cookie is still valid
  useEffect(() => {
    if (!hasPinProp) { setAutoChecking(false); return; }
    getVowTextIfUnlockedAction(partner).then((text) => {
      if (text !== null) {
        setVowText(text);
        setUnlocked(true);
      }
      setAutoChecking(false);
    }).catch(() => setAutoChecking(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSetPin() {
    setPinError("");
    if (pin.length < 4) { setPinError("PIN must be at least 4 characters."); return; }
    if (pin !== pinConfirm) { setPinError("PINs don't match."); return; }
    setPinLoading(true);
    try {
      await setVowsPinAction(partner, pin);
      setHasPin(true);
      setUnlocked(true);
      setVowText(null);
      setStatus("not_started");
      setPin("");
      setPinConfirm("");
    } catch (e) {
      setPinError(e instanceof Error ? e.message : "Failed to set PIN.");
    } finally {
      setPinLoading(false);
    }
  }

  async function handleUnlock() {
    setPinError("");
    if (!pin) { setPinError("Enter your PIN."); return; }
    setPinLoading(true);
    try {
      const text = await unlockVowsAction(partner, pin);
      setVowText(text);
      setUnlocked(true);
      setPin("");
    } catch (e) {
      setPinError(e instanceof Error ? e.message : "Incorrect PIN.");
    } finally {
      setPinLoading(false);
    }
  }

  async function handleResetPin() {
    setResetLoading(true);
    try {
      await resetVowsPinAction(partner);
      setHasPin(false);
      setUnlocked(false);
      setVowText(null);
      setStatus("not_started");
      setShowForgot(false);
      setPin("");
      setPinConfirm("");
    } catch (e) {
      setPinError(e instanceof Error ? e.message : "Failed to reset PIN.");
    } finally {
      setResetLoading(false);
    }
  }

  async function handleSave() {
    setSaveError("");
    setSaving(true);
    try {
      await onSave(draftText || null, status);
      await lockVowsSessionAction(partner);
      setVowText(null);
      setUnlocked(false);
      setEditing(false);
      setPin("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save.";
      if (msg.includes("Session expired")) {
        setUnlocked(false);
        setVowText(null);
        setSaveError("Session expired. Re-enter your PIN to continue.");
      } else {
        setSaveError(msg);
      }
    } finally {
      setSaving(false);
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────
  if (autoChecking) {
    return (
      <div className="flex items-center justify-center gap-3 py-10">
        <motion.div
          className="w-5 h-5 rounded-full border-2 border-rose-200 border-t-rose-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
        />
        <span className="text-xs text-gray-400 font-medium">Verifying session…</span>
      </div>
    );
  }

  // ── No PIN set — first time setup ──────────────────────────────────────
  if (!hasPin && !unlocked) {
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center text-xl shrink-0">
            🔐
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{name}&apos;s Vows</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Create a PIN to protect your vows</p>
          </div>
        </div>

        <div className="space-y-2.5">
          <input
            type="password"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setPinError(""); }}
            onKeyDown={(e) => e.key === "Enter" && pinConfirm && handleSetPin()}
            placeholder="Create a PIN (min. 4 characters)"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition"
          />
          <input
            type="password"
            value={pinConfirm}
            onChange={(e) => { setPinConfirm(e.target.value); setPinError(""); }}
            onKeyDown={(e) => e.key === "Enter" && pin && handleSetPin()}
            placeholder="Confirm PIN"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition"
          />
          <AnimatePresence>
            {pinError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-xs text-red-500 px-1"
              >
                {pinError}
              </motion.p>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={handleSetPin}
            disabled={pinLoading}
            className="w-full py-2.5 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {pinLoading ? "Setting up…" : "Set PIN & Start Writing"}
          </button>
        </div>
      </motion.div>
    );
  }

  // ── PIN set, not yet unlocked ──────────────────────────────────────────
  if (hasPin && !unlocked) {
    if (showForgot) {
      return (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="rounded-xl bg-red-50 border border-red-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">⚠️</span>
              <p className="text-sm font-semibold text-red-700">Reset your PIN?</p>
            </div>
            <p className="text-[12px] text-red-600 leading-relaxed">
              This will permanently delete your vow draft. You&apos;ll need to write them again.
            </p>
          </div>
          {pinError && <p className="text-xs text-red-500 px-1">{pinError}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setShowForgot(false); setPinError(""); }}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleResetPin}
              disabled={resetLoading}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50"
            >
              {resetLoading ? "Resetting…" : "Yes, Reset"}
            </button>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
            <LockIcon className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{name}&apos;s Vows</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Enter your PIN to unlock</p>
          </div>
        </div>

        <div className="space-y-2.5">
          <input
            type="password"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setPinError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            placeholder="Your PIN"
            autoFocus
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition"
          />
          <AnimatePresence>
            {pinError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-xs text-red-500 px-1"
              >
                {pinError}
              </motion.p>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={handleUnlock}
            disabled={pinLoading}
            className="w-full py-2.5 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {pinLoading ? "Unlocking…" : "Unlock My Vows"}
          </button>
          <button
            type="button"
            onClick={() => { setShowForgot(true); setPinError(""); }}
            className="w-full py-1 text-center text-[11px] text-gray-400 hover:text-gray-600 transition"
          >
            Forgot PIN?
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Unlocked ───────────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-base">✍️</div>
          <p className="text-sm font-semibold text-gray-800">{name}&apos;s Vows</p>
        </div>
        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full ring-1 ring-emerald-200 font-semibold">
          Unlocked
        </span>
      </div>

      {editing ? (
        <div className="space-y-3">
          <textarea
            autoFocus
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            rows={7}
            placeholder="Write your vows here…"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 leading-relaxed placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 resize-none transition font-serif"
          />
          <div className="flex items-center justify-end">
            <p className="text-[10px] text-gray-300">
              {draftText.trim().split(/\s+/).filter(Boolean).length} words
            </p>
          </div>

          {/* Status pills */}
          <div className="flex gap-1.5 flex-wrap">
            {(["not_started", "in_progress", "ready"] as VowStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  "text-[11px] px-3 py-1 rounded-full border-[1.5px] font-medium transition-all",
                  status === s
                    ? s === "ready"       ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : s === "in_progress" ? "bg-amber-50 text-amber-700 border-amber-300"
                    : "bg-gray-100 text-gray-600 border-gray-300"
                    : "bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-500"
                )}
              >
                {s === "not_started" ? "Not started" : s === "in_progress" ? "Working on it" : "Ready ✓"}
              </button>
            ))}
          </div>

          {saveError && <p className="text-xs text-red-500">{saveError}</p>}

          <div className="flex items-center justify-between pt-0.5 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { setEditing(false); setSaveError(""); }}
              className="text-xs text-gray-400 hover:text-gray-600 transition py-1"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition disabled:opacity-50 py-1"
            >
              {saving ? "Saving…" : "Save & Lock"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => { setDraftText(vowText ?? ""); setEditing(true); }}
          className="w-full text-left rounded-xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50 hover:border-rose-200 transition-all px-4 py-4 group"
        >
          {vowText ? (
            <>
              <p className="text-sm text-gray-600 leading-relaxed font-serif italic line-clamp-5 group-hover:text-gray-800 transition-colors">
                {vowText}
              </p>
              <p className="text-[10px] text-gray-400 mt-2.5 group-hover:text-rose-400 transition-colors">
                Tap to edit
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400 italic font-serif">
              Click to write your vows…
            </p>
          )}
        </button>
      )}
    </motion.div>
  );
}

// ── Music card ─────────────────────────────────────────────────────────────

function MusicCard({
  processionalSong,
  recessionalSong,
}: {
  processionalSong: string | null;
  recessionalSong:  string | null;
}) {
  const [proc,   setProc]   = useState(processionalSong ?? "");
  const [rec,    setRec]    = useState(recessionalSong  ?? "");
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const router = useRouter();

  async function handleSave() {
    setSaving(true);
    try {
      await updateMusicAction({ processionalSong: proc || null, recessionalSong: rec || null });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch {
      alert("Failed to save music.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {[
        { label: "Processional", note: "♪", value: proc, setter: setProc, placeholder: "e.g. Canon in D — Pachelbel" },
        { label: "Recessional",  note: "♫", value: rec,  setter: setRec,  placeholder: "e.g. Ode to Joy — Beethoven"  },
      ].map(({ label, note, value, setter, placeholder }) => (
        <div key={label}>
          <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            <span className="text-gray-300 text-sm">{note}</span>
            {label}
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => { setter(e.target.value); setSaved(false); }}
            placeholder={placeholder}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/50 transition"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className={cn(
          "w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]",
          saved
            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        )}
      >
        {saving ? "Saving…" : saved ? "✓ Saved" : "Save Music"}
      </button>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function CeremonyClient({
  program,
  initialItems,
  partner1Name,
  partner2Name,
  currentPartner,
  weddingId,
}: CeremonyClientProps) {
  const router = useRouter();

  const [items,           setItems]           = useState<CeremonyItemRow[]>(initialItems);
  const [dialogOpen,      setDialogOpen]       = useState(false);
  const [editingItem,     setEditingItem]      = useState<CeremonyItemRow | null>(null);
  const [seedLoading,     setSeedLoading]      = useState(false);
  const [deletingId,      setDeletingId]       = useState<string | null>(null);
  const [switching,       setSwitching]        = useState(false);
  const [vowsOpen,        setVowsOpen]         = useState(false);
  const [expandedPartner, setExpandedPartner]  = useState<"partner1" | "partner2" | null>(null);

  // ── Computed ───────────────────────────────────────────────────────────

  const readingCount = items.filter((i) => i.type === "reading").length;
  const hasSong      = !!(program?.processionalSong || program?.recessionalSong);

  const p1Status = (program?.partner1VowsStatus ?? "not_started") as VowStatus;
  const p2Status = (program?.partner2VowsStatus ?? "not_started") as VowStatus;

  const vowsOverallStatus =
    p1Status === "ready" && p2Status === "ready" ? "Both ready" :
    (p1Status !== "not_started" || p2Status !== "not_started") ? "In progress" :
    "Not started";

  // ── Handlers ───────────────────────────────────────────────────────────

  async function handlePickPartner(partner: "partner1" | "partner2") {
    setSwitching(true);
    try {
      await setVowsPartnerAction(partner);
      router.refresh();
    } finally {
      setSwitching(false);
    }
  }

  async function handleSaveVows(
    partner: "partner1" | "partner2",
    text: string | null,
    status: VowStatus
  ) {
    await updateVowsAction(partner, text, status);
    router.refresh();
  }

  async function handleSeedTemplate() {
    setSeedLoading(true);
    try {
      const seeded = await seedDefaultCeremonyAction();
      setItems(seeded.map((item) => ({
        id:          item.id,
        programId:   item.programId,
        type:        item.type,
        title:       item.title,
        description: item.description,
        assignedTo:  item.assignedTo,
        notes:       item.notes,
        order:       item.order,
      })));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to load template.");
    } finally {
      setSeedLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this item from the program?")) return;
    setDeletingId(id);
    try {
      await deleteCeremonyItemAction(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      alert("Failed to delete item.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleItemSaved(saved: CeremonyItemRow) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
  }

  function handleOpenAdd() {
    setEditingItem(null);
    setDialogOpen(true);
  }

  function handleOpenEdit(item: CeremonyItemRow) {
    setEditingItem(item);
    setDialogOpen(true);
  }

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const srcIdx = result.source.index;
    const dstIdx = result.destination.index;
    if (srcIdx === dstIdx) return;

    const reordered = Array.from(items);
    const [moved]   = reordered.splice(srcIdx, 1);
    reordered.splice(dstIdx, 0, moved);
    setItems(reordered);

    try {
      await reorderCeremonyItemsAction(reordered.map((i) => i.id));
    } catch {
      setItems(items);
      alert("Failed to save order.");
    }
  }

  // ── Vows card content (called as a function to prevent remounts) ───────

  function VowsCardContent() {
    // Collapsed summary
    if (!vowsOpen) {
      return (
        <div className="space-y-3.5">
          <div className="space-y-2">
            {[
              { name: partner1Name, status: p1Status },
              { name: partner2Name, status: p2Status },
            ].map(({ name, status }) => (
              <div key={name} className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0 shadow-apple-xs">
                  {name.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-medium text-gray-700 flex-1 truncate">{name}</p>
                <StatusBadge status={status} />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => { setVowsOpen(true); setExpandedPartner(null); }}
            className="w-full py-2.5 rounded-xl border-[1.5px] border-dashed border-gray-200 text-sm font-medium text-gray-500 hover:border-rose-200 hover:text-rose-500 hover:bg-rose-50/30 transition-all flex items-center justify-center gap-2"
          >
            <LockIcon className="w-3.5 h-3.5" />
            Open my vows
          </button>
        </div>
      );
    }

    // Partner picker
    if (!expandedPartner) {
      return (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="py-1">
          <div className="text-center mb-5">
            <p className="text-sm font-semibold text-gray-800">Who are you?</p>
            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
              Your vows will stay private until the ceremony.
            </p>
          </div>

          <div className="space-y-2.5">
            {([
              { partner: "partner1" as const, name: partner1Name },
              { partner: "partner2" as const, name: partner2Name },
            ]).map(({ partner, name }) => (
              <button
                key={partner}
                type="button"
                onClick={() => { setExpandedPartner(partner); setVowsPartnerAction(partner); }}
                disabled={switching}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border-[1.5px] border-gray-200 hover:border-rose-200 hover:bg-rose-50/50 text-left transition-all group disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center text-base font-bold text-rose-500 shrink-0 group-hover:from-rose-200 group-hover:to-pink-200 transition-all">
                  {name.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 text-sm font-semibold text-gray-700 group-hover:text-rose-600 transition-colors">
                  {name}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-rose-300 transition-colors" />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setVowsOpen(false)}
            className="w-full mt-4 text-center text-[11px] text-gray-400 hover:text-gray-600 transition py-1"
          >
            Close
          </button>
        </motion.div>
      );
    }

    // Expanded — partner selected
    const myName      = expandedPartner === "partner1" ? partner1Name : partner2Name;
    const theirName   = expandedPartner === "partner1" ? partner2Name : partner1Name;
    const myHasPin    = expandedPartner === "partner1" ? (program?.partner1HasPin ?? false) : (program?.partner2HasPin ?? false);
    const theirStatus = expandedPartner === "partner1" ? p2Status : p1Status;

    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
        <MyVowCard
          partner={expandedPartner}
          name={myName}
          hasPin={myHasPin}
          onSave={(text, status) => handleSaveVows(expandedPartner, text, status)}
        />
        <PartnerVowCard name={theirName} status={theirStatus} />
        <div className="pt-3 mt-4 flex items-center justify-between border-t border-gray-100">
          <button
            type="button"
            onClick={() => setExpandedPartner(null)}
            disabled={switching}
            className="text-[11px] text-gray-400 hover:text-gray-700 hover:underline disabled:opacity-50 transition"
          >
            Switch partner
          </button>
          <button
            type="button"
            onClick={() => { setVowsOpen(false); setExpandedPartner(null); }}
            className="text-[11px] text-gray-400 hover:text-gray-700 hover:underline transition"
          >
            Close
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-apple-sm px-8 py-28 text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center text-4xl mb-6 shadow-apple-sm">
            💒
          </div>
          <h2 className="font-serif text-2xl text-gray-800 mb-3">Plan your ceremony</h2>
          <p className="text-sm text-gray-400 max-w-xs mb-8 leading-relaxed">
            Build your order of service, write your vows privately, and choose your processional music.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="secondary" size="md" onClick={handleSeedTemplate} loading={seedLoading}>
              ✨ Load default program
            </Button>
            <Button variant="primary" size="md" onClick={handleOpenAdd}>
              + Add first item
            </Button>
          </div>
        </motion.div>

        <AddCeremonyItemDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          editingItem={editingItem}
          onSuccess={handleItemSaved}
        />
      </>
    );
  }

  // ── Full view ──────────────────────────────────────────────────────────

  const stats = [
    { label: "Program items", value: String(items.length),   icon: "📋", bg: "bg-blue-50"   },
    { label: "Readings",      value: readingCount > 0 ? String(readingCount) : "None", icon: "📖", bg: "bg-purple-50" },
    { label: "Vows",          value: vowsOverallStatus,       icon: "💍", bg: "bg-rose-50"   },
    { label: "Music",         value: hasSong ? "Selected" : "Not set", icon: "🎵", bg: "bg-amber-50" },
  ];

  return (
    <>
      {/* ── Stats bar ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white rounded-2xl shadow-apple-sm p-4 flex items-center gap-3"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0", stat.bg)}>
              {stat.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-400 font-medium truncate">{stat.label}</p>
              <p className="text-[15px] font-semibold text-gray-900 leading-tight">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Two-column layout ──────────────────────────────────────────── */}
      <div className="flex gap-6 items-start">

        {/* ── Left: Order of Service ─────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold text-gray-900">Order of Service</h2>
              <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">
                {items.length}
              </span>
            </div>
            <Button variant="primary" size="sm" onClick={handleOpenAdd}>
              + Add item
            </Button>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="ceremony-program">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-2"
                >
                  {items.map((item, index) => {
                    const color      = CEREMONY_ITEM_COLORS[item.type as CeremonyItemType] ?? "#6b7280";
                    const icon       = CEREMONY_ITEM_ICONS[item.type as CeremonyItemType]  ?? "✨";
                    const label      = CEREMONY_ITEM_LABELS[item.type as CeremonyItemType] ?? item.type;
                    const isDeleting = deletingId === item.id;

                    return (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(drag, snapshot) => (
                          <div
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                          >
                            <div
                              className={cn(
                                "bg-white rounded-xl shadow-apple-sm overflow-hidden group flex items-stretch transition-all duration-200",
                                snapshot.isDragging && "shadow-apple-lg ring-2 ring-accent/20 rotate-[0.3deg] scale-[1.01]",
                                isDeleting && "opacity-40 pointer-events-none"
                              )}
                              style={{ borderLeft: `3px solid ${color}` }}
                            >
                              {/* Drag handle */}
                              <div
                                {...drag.dragHandleProps}
                                className="flex flex-col items-center justify-center gap-0.5 px-2.5 text-gray-200 hover:text-gray-400 cursor-grab active:cursor-grabbing transition-colors"
                                title="Drag to reorder"
                              >
                                <div className="grid grid-cols-2 gap-[3px]">
                                  {[...Array(6)].map((_, i) => (
                                    <span key={i} className="w-[3px] h-[3px] rounded-full bg-current" />
                                  ))}
                                </div>
                              </div>

                              {/* Step number */}
                              <div className="flex items-center justify-center w-9 shrink-0">
                                <span className="text-[11px] font-bold text-gray-300 tabular-nums">
                                  {String(index + 1).padStart(2, "0")}
                                </span>
                              </div>

                              {/* Content */}
                              <div className="flex-1 py-4 pr-3 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    {/* Type badge */}
                                    <span
                                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-2 tracking-wide uppercase"
                                      style={{ backgroundColor: `${color}18`, color }}
                                    >
                                      {icon} {label}
                                    </span>

                                    {/* Title */}
                                    <p className="text-[14px] font-semibold text-gray-900 leading-snug">
                                      {item.title}
                                    </p>

                                    {/* Description */}
                                    {item.description && (
                                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                        {item.description}
                                      </p>
                                    )}

                                    {/* Assigned to */}
                                    {item.assignedTo && (
                                      <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1.5">
                                        <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[9px] shrink-0">👤</span>
                                        {item.assignedTo}
                                      </p>
                                    )}
                                  </div>

                                  {/* Edit / Delete */}
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit(item)}
                                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                                      title="Edit"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(item.id)}
                                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                      title="Delete"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Add item button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-accent/40 hover:text-accent hover:bg-accent/[0.02] transition-all"
            >
              + Add program item
            </button>
          </div>
        </div>

        {/* ── Right: Vows + Music ─────────────────────────────────────── */}
        <div className="w-80 shrink-0 space-y-4">

          {/* Vows card */}
          <div className="bg-white rounded-2xl shadow-apple-sm overflow-hidden">
            <div className="bg-gradient-to-r from-rose-50 via-pink-50/40 to-transparent px-5 pt-5 pb-4 border-b border-rose-100/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">💍</span>
                  <h2 className="text-sm font-semibold text-gray-900">Vows</h2>
                </div>
                <div className="flex items-center gap-1.5 bg-white/80 rounded-full px-2.5 py-1 border border-gray-100 shadow-apple-xs">
                  <LockIcon className="w-3 h-3 text-gray-400" />
                  <span className="text-[10px] text-gray-400 font-medium">Private</span>
                </div>
              </div>
            </div>
            <div className="p-5">
              {VowsCardContent()}
            </div>
          </div>

          {/* Music card */}
          <div className="bg-white rounded-2xl shadow-apple-sm overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-gray-50">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🎵</span>
                <h2 className="text-sm font-semibold text-gray-900">Music</h2>
              </div>
            </div>
            <div className="p-5">
              <MusicCard
                processionalSong={program?.processionalSong ?? null}
                recessionalSong={program?.recessionalSong   ?? null}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Dialog */}
      <AddCeremonyItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingItem={editingItem}
        onSuccess={handleItemSaved}
      />
    </>
  );
}
