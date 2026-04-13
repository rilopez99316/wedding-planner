"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import type { ClientGuest } from "@/lib/types/seating";
import { avatarPaletteForName } from "./seatingPalette";

interface SeatPickerMenuProps {
  open:             boolean;
  onOpenChange:     (open: boolean) => void;
  tableName:        string;
  seatNumber:       number;
  /** Guest currently sitting here, or null if the seat is empty. */
  occupiedGuest:    ClientGuest | null;
  /** Guests that haven't been seated yet (shown when seat is empty). */
  unassignedGuests: ClientGuest[];
  onAssign:         (guestId: string) => Promise<void>;
  onUnassign:       () => Promise<void>;
}

export default function SeatPickerMenu({
  open,
  onOpenChange,
  tableName,
  seatNumber,
  occupiedGuest,
  unassignedGuests,
  onAssign,
  onUnassign,
}: SeatPickerMenuProps) {
  const [loading,      setLoading]      = useState<string | null>(null);
  const [unassigning,  setUnassigning]  = useState(false);
  const [error,        setError]        = useState("");

  async function handleAssign(guestId: string) {
    setLoading(guestId);
    setError("");
    try {
      await onAssign(guestId);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign guest.");
    } finally {
      setLoading(null);
    }
  }

  async function handleUnassign() {
    setUnassigning(true);
    setError("");
    try {
      await onUnassign();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove guest.");
    } finally {
      setUnassigning(false);
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
                <div className="bg-white rounded-2xl shadow-apple-xl w-full max-w-sm focus:outline-none overflow-hidden">
                  {/* Header */}
                  <div
                    className="px-5 py-4 border-b border-rose-100"
                    style={{ background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)" }}
                  >
                    <Dialog.Title className="text-base font-semibold text-rose-800">
                      Seat {seatNumber} · {tableName}
                    </Dialog.Title>
                    <p className="text-xs text-rose-400 mt-0.5">
                      {occupiedGuest
                        ? `${occupiedGuest.firstName} ${occupiedGuest.lastName} is sitting here`
                        : "This seat is empty — pick a guest"}
                    </p>
                  </div>

                  <div className="p-5">
                    {error && (
                      <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">
                        {error}
                      </p>
                    )}

                    {/* Occupied seat: show the current guest + unassign option */}
                    {occupiedGuest ? (
                      <div className="flex flex-col gap-3">
                        <OccupiedCard guest={occupiedGuest} />
                        <Button
                          variant="secondary"
                          className="w-full text-red-600 hover:bg-red-50 border border-red-100"
                          onClick={handleUnassign}
                          loading={unassigning}
                        >
                          Remove from this seat
                        </Button>
                      </div>
                    ) : (
                      /* Empty seat: show unassigned guest list */
                      <>
                        {unassignedGuests.length === 0 ? (
                          <div className="text-center py-6">
                            <p className="text-2xl mb-2">🎉</p>
                            <p className="text-sm font-medium text-gray-700">All guests seated!</p>
                            <p className="text-xs text-gray-400 mt-1">
                              No unassigned guests remain.
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                            {unassignedGuests.map((guest) => {
                              const avatar = avatarPaletteForName(guest.firstName, guest.lastName);
                              const isLoading = loading === guest.id;
                              return (
                                <button
                                  key={guest.id}
                                  type="button"
                                  disabled={isLoading}
                                  onClick={() => handleAssign(guest.id)}
                                  className={cn(
                                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border text-left transition-all",
                                    "border-gray-100 hover:border-rose-200 hover:bg-rose-50/40 disabled:opacity-50"
                                  )}
                                >
                                  {/* Avatar */}
                                  <div
                                    className={cn(
                                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold relative overflow-hidden",
                                      avatar.bg, avatar.text
                                    )}
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
                                    <span className="relative">
                                      {guest.firstName[0]?.toUpperCase()}{guest.lastName[0]?.toUpperCase()}
                                    </span>
                                  </div>
                                  {/* Name */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {guest.firstName} {guest.lastName}
                                      {guest.isPlusOne && (
                                        <span className="ml-1 text-gray-400 text-xs">+1</span>
                                      )}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">{guest.groupName}</p>
                                  </div>
                                  {isLoading && <Spinner size="sm" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}

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
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function OccupiedCard({ guest }: { guest: ClientGuest }) {
  const avatar = avatarPaletteForName(guest.firstName, guest.lastName);
  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-rose-50 border border-rose-100">
      <div
        className={cn(
          "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold relative overflow-hidden",
          avatar.bg, avatar.text
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
        <span className="relative">
          {guest.firstName[0]?.toUpperCase()}{guest.lastName[0]?.toUpperCase()}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-rose-800 truncate">
          {guest.firstName} {guest.lastName}
        </p>
        <p className="text-xs text-rose-400 truncate">{guest.groupName}</p>
      </div>
    </div>
  );
}
