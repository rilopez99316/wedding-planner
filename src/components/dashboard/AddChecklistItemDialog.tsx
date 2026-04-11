"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { addCustomChecklistItemAction } from "@/lib/actions/checklist";

// ── Types ──────────────────────────────────────────────────────────────────

interface CategoryOption {
  key:   string;
  label: string;
}

interface AddChecklistItemDialogProps {
  open:             boolean;
  onOpenChange:     (open: boolean) => void;
  defaultCategory:  string;
  categoryOptions:  CategoryOption[];
  onSuccess:        () => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function AddChecklistItemDialog({
  open,
  onOpenChange,
  defaultCategory,
  categoryOptions,
  onSuccess,
}: AddChecklistItemDialogProps) {
  const [title,    setTitle]    = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [dueDate,  setDueDate]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setCategory(defaultCategory);
      setDueDate("");
      setError("");
    }
  }, [open, defaultCategory]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await addCustomChecklistItemAction({
        title:   title.trim(),
        category,
        dueDate: dueDate || null,
      });
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
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
                <div className="bg-white rounded-xl shadow-apple-xl w-full max-w-md">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <Dialog.Title className="text-[15px] font-semibold text-gray-900">
                      Add custom task
                    </Dialog.Title>
                    <Dialog.Close className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Dialog.Close>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <Input
                      label="Task *"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Schedule tasting with caterer"
                      required
                      autoFocus
                    />

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-gray-600">Timeline section *</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                        className="w-full px-4 py-3 min-h-[44px] rounded-md text-[15px] bg-gray-100 border-0 text-gray-900 outline-none transition-all duration-150 focus:bg-white focus:shadow-apple-sm focus:ring-2 focus:ring-accent/25"
                      >
                        {categoryOptions.map((c) => (
                          <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                      </select>
                    </div>

                    <Input
                      label="Due date (optional)"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />

                    {error && (
                      <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Dialog.Close asChild>
                        <Button type="button" variant="secondary" size="md" className="flex-1">
                          Cancel
                        </Button>
                      </Dialog.Close>
                      <Button type="submit" variant="primary" size="md" loading={loading} className="flex-1">
                        Add task
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
