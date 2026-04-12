"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import type { ClientGuest, ClientTable } from "@/lib/types/seating";

interface AssignGuestMenuProps {
  guest:      ClientGuest;
  tables:     ClientTable[];
  open:       boolean;
  onOpenChange: (open: boolean) => void;
  onAssign:   (tableId: string) => Promise<void>;
  currentTableId?: string;
}

export default function AssignGuestMenu({
  guest,
  tables,
  open,
  onOpenChange,
  onAssign,
  currentTableId,
}: AssignGuestMenuProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error,   setError]   = useState("");

  async function handleSelect(tableId: string) {
    setLoading(tableId);
    setError("");
    try {
      await onAssign(tableId);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign guest.");
    } finally {
      setLoading(null);
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
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
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
                <div className="bg-white rounded-2xl shadow-apple-xl w-full max-w-sm p-5 max-h-[85vh] overflow-y-auto focus:outline-none">
                <Dialog.Title className="text-base font-semibold text-gray-900 mb-1">
                  Assign {guest.firstName} {guest.lastName}
                </Dialog.Title>
                <p className="text-sm text-gray-400 mb-4">Choose a table with available seats.</p>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>
                )}

                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                  {tables.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No tables yet. Add one first.</p>
                  )}
                  {tables.map((table) => {
                    const used    = table.guestIds.length;
                    const full    = used >= table.capacity;
                    const current = table.id === currentTableId;
                    const isLoading = loading === table.id;

                    return (
                      <button
                        key={table.id}
                        type="button"
                        disabled={full || isLoading}
                        onClick={() => handleSelect(table.id)}
                        className={cn(
                          "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border text-left transition-all",
                          current
                            ? "border-accent bg-accent-light"
                            : full
                            ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                            : "border-gray-200 hover:border-accent hover:bg-accent-light/50"
                        )}
                      >
                        <span className="text-base">{table.shape === "ROUND" ? "○" : "□"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{table.name}</p>
                          <p className="text-xs text-gray-400">
                            {used} / {table.capacity} seats{full ? " · Full" : ""}
                          </p>
                        </div>
                        {current && (
                          <svg className="w-3.5 h-3.5 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {isLoading && <Spinner size="sm" />}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
