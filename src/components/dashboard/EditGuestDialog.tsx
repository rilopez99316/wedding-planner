"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { updateGuestGroupAction } from "@/lib/actions/guests";
import type { GuestGroup, Guest, WeddingEvent, GuestGroupEvent } from "@prisma/client";

type GuestGroupWithRelations = GuestGroup & {
  guests: Guest[];
  allowedEvents: (GuestGroupEvent & { event: WeddingEvent })[];
};

interface EditGuestDialogProps {
  group: GuestGroupWithRelations;
  events: WeddingEvent[];
  children: React.ReactNode; // trigger element
}

export default function EditGuestDialog({ group, events, children }: EditGuestDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [groupName, setGroupName] = useState(group.groupName);
  const [tier, setTier] = useState<"A" | "B">(group.invitationTier as "A" | "B");
  const [hasPlusOne, setHasPlusOne] = useState(group.hasPlusOne);
  const [plusOneNameIfKnown, setPlusOneNameIfKnown] = useState(group.plusOneNameIfKnown ?? "");
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>(
    group.allowedEvents.map((ae) => ae.eventId)
  );

  function toggleEvent(eventId: string) {
    setSelectedEventIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!groupName) { setError("Please enter a group name."); return; }

    setLoading(true);
    try {
      await updateGuestGroupAction(group.id, {
        groupName,
        hasPlusOne,
        plusOneNameIfKnown: plusOneNameIfKnown || undefined,
        invitationTier: tier,
        guests: group.guests.map((g) => ({
          firstName: g.firstName,
          lastName: g.lastName,
          email: g.email ?? "",
        })),
        eventIds: selectedEventIds,
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>

      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
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
                <div className="bg-white rounded-xl shadow-apple-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <Dialog.Title className="text-[15px] font-semibold text-gray-900">
                      Edit — {group.groupName}
                    </Dialog.Title>
                    <Dialog.Close className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Dialog.Close>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Group name */}
                    <Input
                      label="Group name"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      required
                    />

                    {/* Guests (read-only display) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">Guests</label>
                      <div className="rounded-md border border-gray-200 divide-y divide-gray-100">
                        {group.guests.map((g) => (
                          <div key={g.id} className="px-3 py-2 flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-gray-700">{g.firstName} {g.lastName}</span>
                            {g.email && <span className="text-xs text-gray-400">· {g.email}</span>}
                            {g.phone && <span className="text-xs text-gray-400">· {g.phone}</span>}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400">To change guest names, delete this group and re-add.</p>
                    </div>

                    {/* Tier */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">Invitation tier</label>
                      <div className="flex gap-2">
                        {(["A", "B"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTier(t)}
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                              tier === t
                                ? "bg-accent text-white shadow-apple-sm"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {t}-list
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Plus one */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div
                          className={`w-10 h-6 rounded-full transition-all duration-200 ${hasPlusOne ? "bg-accent" : "bg-gray-200"}`}
                          onClick={() => setHasPlusOne(!hasPlusOne)}
                        >
                          <div
                            className="w-5 h-5 bg-white rounded-full shadow-apple-sm mt-0.5 transition-transform duration-200"
                            style={{ transform: hasPlusOne ? "translateX(18px)" : "translateX(2px)" }}
                          />
                        </div>
                        <span className="text-sm text-gray-700">Allow a plus-one</span>
                      </label>
                      {hasPlusOne && (
                        <Input
                          label="Plus-one name (if known)"
                          placeholder="Leave blank if unknown"
                          value={plusOneNameIfKnown}
                          onChange={(e) => setPlusOneNameIfKnown(e.target.value)}
                        />
                      )}
                    </div>

                    {/* Events */}
                    {events.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-600">Invited to</label>
                        <div className="grid grid-cols-2 gap-2">
                          {events.map((event) => {
                            const checked = selectedEventIds.includes(event.id);
                            return (
                              <label
                                key={event.id}
                                className={`flex items-center gap-2 p-2.5 rounded-md border cursor-pointer transition-all duration-150 ${
                                  checked ? "border-accent bg-accent-light" : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleEvent(event.id)}
                                  className="sr-only"
                                />
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${checked ? "bg-accent border-accent" : "border-gray-300"}`}>
                                  {checked && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                                      <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                  )}
                                </div>
                                <span className="text-xs font-medium text-gray-700">{event.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {error && (
                      <p className="text-sm text-red-500 bg-red-50 rounded-md px-3 py-2">{error}</p>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Dialog.Close asChild>
                        <Button type="button" variant="secondary" size="md" className="flex-1">Cancel</Button>
                      </Dialog.Close>
                      <Button type="submit" variant="primary" size="md" loading={loading} className="flex-1">
                        Save changes
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
