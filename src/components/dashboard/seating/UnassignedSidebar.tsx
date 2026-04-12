"use client";

import { useState, useMemo } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import type { ClientGuest } from "@/lib/types/seating";
import GuestChip from "./GuestChip";

interface UnassignedSidebarProps {
  unassignedGuests:  ClientGuest[];
  onClickAssign:     (guest: ClientGuest) => void;
  /** Mobile visibility */
  isOpen:            boolean;
  onClose:           () => void;
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

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <p className="text-sm font-semibold text-gray-900">Unassigned Guests</p>
          <p className="text-xs text-gray-400">{unassignedGuests.length} to seat</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="md:hidden p-1 text-gray-400 hover:text-gray-600 rounded-lg"
          aria-label="Close sidebar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="relative">
          <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guests…"
            className="w-full pl-7 pr-3 py-1.5 text-sm bg-gray-50 rounded-lg border border-gray-100 focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent"
          />
        </div>
      </div>

      {/* Droppable guest list */}
      <Droppable droppableId="unassigned">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2 min-h-0 transition-colors",
              snapshot.isDraggingOver && "bg-gray-50"
            )}
          >
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center px-2">
                {unassignedGuests.length === 0 ? (
                  <>
                    <p className="text-2xl mb-2">🎉</p>
                    <p className="text-sm font-medium text-gray-700">All guests seated!</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Every confirmed guest has a table assignment.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-400">No results for &ldquo;{search}&rdquo;</p>
                  </>
                )}
              </div>
            )}
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
      <aside className="hidden md:flex flex-col w-72 flex-shrink-0 bg-white border border-gray-100 rounded-xl shadow-apple-xs overflow-hidden" style={{ maxHeight: "calc(100vh - 160px)", position: "sticky", top: "24px" }}>
        {sidebarContent}
      </aside>

      {/* Mobile bottom sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={onClose}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-apple-xl max-h-[70vh] flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
