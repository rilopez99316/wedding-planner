"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { TableShape } from "@prisma/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { createTableAction, updateTableAction } from "@/lib/actions/seating";
import type { ClientTable } from "@/lib/types/seating";

interface AddTableDialogProps {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  editingTable:  ClientTable | null;
  onSuccess:     (table: ClientTable) => void;
}

const SHAPES: { value: TableShape; label: string; icon: string; desc: string }[] = [
  { value: "ROUND",       label: "Round",       icon: "○", desc: "8–10 guests" },
  { value: "RECTANGULAR", label: "Rectangular", icon: "□", desc: "10–12 guests" },
];

export default function AddTableDialog({
  open,
  onOpenChange,
  editingTable,
  onSuccess,
}: AddTableDialogProps) {
  const isEdit = !!editingTable;

  const [name,     setName]     = useState("");
  const [capacity, setCapacity] = useState<number>(8);
  const [shape,    setShape]    = useState<TableShape>("ROUND");
  const [notes,    setNotes]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    if (open) {
      setName(editingTable?.name ?? "");
      setCapacity(editingTable?.capacity ?? 8);
      setShape(editingTable?.shape ?? "ROUND");
      setNotes(editingTable?.notes ?? "");
      setError("");
    }
  }, [open, editingTable]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = { name: name.trim(), capacity, shape, notes: notes.trim() || null };
      const result = isEdit
        ? await updateTableAction(editingTable!.id, data)
        : await createTableAction(data);
      onSuccess(result);
      onOpenChange(false);
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
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 8 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed inset-0 flex items-center justify-center z-50 p-4"
              >
                <div className="bg-white rounded-2xl shadow-apple-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 focus:outline-none">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 mb-5">
                    {isEdit ? "Edit Table" : "Add Table"}
                  </Dialog.Title>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* Table name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Table name
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Table 1, Sweetheart Table"
                      required
                      autoFocus
                    />
                  </div>

                  {/* Shape */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shape
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {SHAPES.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setShape(s.value)}
                          className={cn(
                            "flex flex-col items-center gap-1 py-3 px-4 rounded-xl border-2 transition-all text-sm font-medium",
                            shape === s.value
                              ? "border-accent bg-accent-light text-accent"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          )}
                        >
                          <span className="text-2xl">{s.icon}</span>
                          <span>{s.label}</span>
                          <span className="text-xs font-normal text-gray-400">{s.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Capacity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Seats
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setCapacity((c) => Math.max(1, c - 1))}
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-gray-400 transition-colors"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-base font-semibold text-gray-900">
                        {capacity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCapacity((c) => Math.min(500, c + 1))}
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-gray-400 transition-colors"
                      >
                        +
                      </button>
                      <span className="text-sm text-gray-400">seats</span>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Near the dance floor"
                      rows={2}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                  )}

                  <div className="flex gap-3 pt-1">
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => onOpenChange(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={loading || !name.trim()}>
                      {loading ? <Spinner size="sm" /> : isEdit ? "Save Changes" : "Add Table"}
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
