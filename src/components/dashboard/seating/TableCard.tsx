"use client";

import { Droppable, Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import type { ClientGuest, ClientTable } from "@/lib/types/seating";
import GuestChip from "./GuestChip";

interface TableCardProps {
  table:           ClientTable;
  guests:          ClientGuest[];
  guestMap:        Record<string, ClientGuest>;
  onEdit:          () => void;
  onDelete:        () => void;
  onRemoveGuest:   (guestId: string) => void;
  onClickAssign:   (guest: ClientGuest) => void;
}

export default function TableCard({
  table,
  guests,
  guestMap,
  onEdit,
  onDelete,
  onRemoveGuest,
  onClickAssign,
}: TableCardProps) {
  const used     = table.guestIds.length;
  const capacity = table.capacity;
  const pct      = capacity > 0 ? Math.min(1, used / capacity) : 0;
  const isFull   = used >= capacity;

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-apple-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base text-gray-400 flex-shrink-0">
            {table.shape === "ROUND" ? "○" : "□"}
          </span>
          <span className="text-sm font-semibold text-gray-900 truncate">{table.name}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Edit table"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Delete table"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      {/* Capacity bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-1">
          <span className={cn("text-xs font-medium", isFull ? "text-amber-600" : "text-gray-500")}>
            {used} / {capacity} seats
          </span>
          {isFull && (
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
              Full
            </span>
          )}
        </div>
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              isFull ? "bg-amber-400" : "bg-accent"
            )}
            style={{ width: `${pct * 100}%` }}
          />
        </div>
      </div>

      {/* Drop zone */}
      <Droppable droppableId={`table-${table.id}`} direction="horizontal">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex flex-wrap gap-1.5 min-h-[60px] px-4 pb-4 pt-2 transition-colors rounded-b-2xl",
              snapshot.isDraggingOver
                ? "bg-accent-light ring-2 ring-inset ring-accent/30"
                : "bg-transparent"
            )}
          >
            {guests.map((guest, index) => (
              <Draggable key={guest.id} draggableId={guest.id} index={index}>
                {(dragProvided, dragSnapshot) => (
                  <GuestChip
                    guest={guest}
                    provided={dragProvided}
                    snapshot={dragSnapshot}
                    compact
                    onClickAssign={() => onClickAssign(guest)}
                    onClickRemove={() => onRemoveGuest(guest.id)}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {guests.length === 0 && !snapshot.isDraggingOver && (
              <p className="text-xs text-gray-300 w-full text-center pt-2 select-none">
                Drop guests here
              </p>
            )}
          </div>
        )}
      </Droppable>

      {/* Notes */}
      {table.notes && (
        <p className="px-4 pb-3 text-xs text-gray-400 italic border-t border-gray-50 pt-2">
          {table.notes}
        </p>
      )}
    </div>
  );
}
