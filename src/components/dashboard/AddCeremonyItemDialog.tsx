"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  addCeremonyItemAction,
  updateCeremonyItemAction,
} from "@/lib/actions/ceremony";
import {
  CEREMONY_ITEM_TYPE_ORDER,
  CEREMONY_ITEM_LABELS,
  CEREMONY_ITEM_COLORS,
  CEREMONY_ITEM_ICONS,
  CEREMONY_ITEM_DEFAULT_TITLES,
  type CeremonyItemType,
} from "@/lib/ceremony-constants";

// ── Types ──────────────────────────────────────────────────────────────────

export type CeremonyItemRow = {
  id:          string;
  programId:   string;
  type:        string;
  title:       string;
  description: string | null;
  assignedTo:  string | null;
  notes:       string | null;
  order:       number;
};

interface AddCeremonyItemDialogProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  editingItem:  CeremonyItemRow | null;
  onSuccess:    (item: CeremonyItemRow) => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function AddCeremonyItemDialog({
  open,
  onOpenChange,
  editingItem,
  onSuccess,
}: AddCeremonyItemDialogProps) {
  const [type,        setType]        = useState<CeremonyItemType>("processional");
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo,  setAssignedTo]  = useState("");
  const [notes,       setNotes]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const isEditMode = !!editingItem;

  // Populate form when editing
  useEffect(() => {
    if (editingItem) {
      setType((editingItem.type as CeremonyItemType) ?? "custom");
      setTitle(editingItem.title);
      setDescription(editingItem.description ?? "");
      setAssignedTo(editingItem.assignedTo   ?? "");
      setNotes(editingItem.notes             ?? "");
    } else {
      setType("processional");
      setTitle(CEREMONY_ITEM_DEFAULT_TITLES["processional"]);
      setDescription("");
      setAssignedTo("");
      setNotes("");
    }
    setError("");
  }, [editingItem, open]);

  // Auto-fill title when type changes (add mode only)
  function handleTypeChange(newType: CeremonyItemType) {
    setType(newType);
    if (!isEditMode) {
      setTitle(CEREMONY_ITEM_DEFAULT_TITLES[newType]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        type,
        title:       title.trim(),
        description: description.trim() || null,
        assignedTo:  assignedTo.trim()  || null,
        notes:       notes.trim()       || null,
      };

      let saved: CeremonyItemRow;
      if (isEditMode) {
        saved = (await updateCeremonyItemAction(editingItem.id, payload)) as CeremonyItemRow;
      } else {
        saved = (await addCeremonyItemAction(payload)) as CeremonyItemRow;
      }

      onSuccess(saved);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const selectedColor = CEREMONY_ITEM_COLORS[type] ?? "#6b7280";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-2xl shadow-apple-xl overflow-hidden"
              >
                {/* Color accent bar */}
                <div className="h-1 w-full" style={{ backgroundColor: selectedColor }} />

                <div className="p-6">
                  <Dialog.Title className="text-[17px] font-semibold text-gray-900 mb-5">
                    {isEditMode ? "Edit program item" : "Add program item"}
                  </Dialog.Title>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Type selector */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">Type</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {CEREMONY_ITEM_TYPE_ORDER.map((t) => {
                          const color   = CEREMONY_ITEM_COLORS[t];
                          const icon    = CEREMONY_ITEM_ICONS[t];
                          const label   = CEREMONY_ITEM_LABELS[t];
                          const active  = type === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => handleTypeChange(t)}
                              className={cn(
                                "flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 border text-left",
                                active
                                  ? "border-transparent text-white shadow-sm"
                                  : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                              )}
                              style={active ? { backgroundColor: color } : undefined}
                            >
                              <span className="text-sm leading-none">{icon}</span>
                              <span className="truncate">{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Title</label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Scripture Reading"
                        required
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">
                        Description <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief description or notes visible in the program"
                        rows={2}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none transition"
                      />
                    </div>

                    {/* Assigned to */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">
                        Assigned to <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <Input
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        placeholder="e.g. Maid of Honor, Officiant"
                      />
                    </div>

                    {/* Private notes */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">
                        Private notes <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Internal notes — not shown in the printed program"
                        rows={2}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none transition"
                      />
                    </div>

                    {error && (
                      <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        className="flex-1"
                        onClick={() => onOpenChange(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        className="flex-1"
                        loading={loading}
                      >
                        {isEditMode ? "Save changes" : "Add item"}
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
