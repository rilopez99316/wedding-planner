"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import type { ClientGuest } from "@/lib/types/seating";
import GuestChip from "./GuestChip";

interface UnassignedSidebarProps {
  unassignedGuests: ClientGuest[];
  onClickAssign:    (guest: ClientGuest) => void;
  /** Mobile visibility */
  isOpen:           boolean;
  onClose:          () => void;
}

export default function UnassignedSidebar({
  unassignedGuests,
  onClickAssign,
  isOpen,
  onClose,
}: UnassignedSidebarProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return unassignedGuests;
    return unassignedGuests.filter(
      (g) =>
        g.firstName.toLowerCase().includes(q) ||
        g.lastName.toLowerCase().includes(q) ||
        g.groupName.toLowerCase().includes(q)
    );
  }, [unassignedGuests, search]);

  const allSeated = unassignedGuests.length === 0;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header — warm blush gradient */}
      <div
        className="flex items-center justify-between px-4 py-3.5 border-b border-rose-100 flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)" }}
      >
        <div>
          <p className="text-sm font-semibold text-rose-800">Guest List</p>
          <p className="text-xs text-rose-400 mt-0.5">
            {allSeated
              ? "Every guest has a seat!"
              : `${unassignedGuests.length} still need${unassignedGuests.length === 1 ? "s" : ""} a seat`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="md:hidden p-1 text-rose-300 hover:text-rose-600 rounded-lg transition-colors"
          aria-label="Close sidebar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Drag hint */}
      {!allSeated && (
        <div className="px-4 py-2 bg-rose-50/60 border-b border-rose-50 flex-shrink-0">
          <p className="text-[11px] text-rose-400 flex items-center gap-1.5">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4 4 4m6 0v12m0 0 4-4m-4 4-4-4" />
            </svg>
            Drag guests onto a table, or tap Assign
          </p>
        </div>
      )}

      {/* Search */}
      {!allSeated && (
        <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guests…"
              className="w-full pl-7 pr-3 py-1.5 text-sm bg-gray-50 rounded-lg border border-gray-100 focus:outline-none focus:ring-1 focus:ring-rose-300 focus:border-rose-300"
            />
          </div>
        </div>
      )}

      {/* Droppable guest list */}
      <Droppable droppableId="unassigned">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2 min-h-0 transition-colors",
              snapshot.isDraggingOver && "bg-rose-50/40"
            )}
          >
            {/* All-seated celebration */}
            {allSeated && (
              <AnimatePresence>
                <motion.div
                  key="all-seated"
                  initial={{ opacity: 0, scale: 0.88 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="flex flex-col items-center justify-center py-12 text-center px-4"
                >
                  <div className="text-5xl mb-3 leading-none select-none">🥂</div>
                  <p className="text-base font-bold text-rose-700">Every guest has a seat!</p>
                  <p className="text-xs text-rose-400 mt-1 max-w-[160px] leading-relaxed">
                    Your seating chart is complete. Time to celebrate!
                  </p>
                  {/* Confetti dots */}
                  <div className="flex gap-1.5 mt-4" aria-hidden>
                    {(["bg-rose-300", "bg-violet-300", "bg-amber-300", "bg-pink-300", "bg-teal-300"] as const).map(
                      (c, i) => (
                        <div key={i} className={cn("w-2 h-2 rounded-full", c)} />
                      )
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {/* No-search-results */}
            {!allSeated && filtered.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">
                No results for &ldquo;{search}&rdquo;
              </p>
            )}

            {/* Guest chips */}
            {filtered.map((guest, index) => (
              <Draggable key={guest.id} draggableId={guest.id} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <GuestChip
                    guest={guest}
                    provided={dragProvided}
                    snapshot={dragSnapshot}
                    compact={false}
                    onClickAssign={() => onClickAssign(guest)}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-72 flex-shrink-0 bg-white border border-rose-100 rounded-xl shadow-apple-xs overflow-hidden"
        style={{ maxHeight: "calc(100vh - 160px)", position: "sticky", top: "24px" }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile bottom sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={onClose}
          />
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl shadow-apple-xl max-h-[70vh] flex flex-col overflow-hidden"
            style={{ background: "linear-gradient(180deg, #fdf2f8 0%, white 64px)" }}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
