"use client";

import { Droppable, Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import type { ClientGuest, ClientTable } from "@/lib/types/seating";
import GuestChip from "./GuestChip";
import TableDiagram from "./TableDiagram";
import { paletteForTable } from "./seatingPalette";

interface TableCardProps {
  table:          ClientTable;
  guests:         ClientGuest[];
  guestMap:       Record<string, ClientGuest>;
  onEdit:         () => void;
  onDelete:       () => void;
  onRemoveGuest:  (guestId: string) => void;
  onClickAssign:  (guest: ClientGuest) => void;
  /** Called when the user clicks a seat circle in the diagram. */
  onClickSeat:    (seatNumber: number, occupiedGuestId: string | null) => void;
}

export default function TableCard({
  table,
  guests,
  guestMap,
  onEdit,
  onDelete,
  onRemoveGuest,
  onClickAssign,
  onClickSeat,
}: TableCardProps) {
  const used     = table.guestIds.length;
  const capacity = table.capacity;
  const pct      = capacity > 0 ? Math.min(1, used / capacity) : 0;
  const isFull   = used >= capacity;

  const palette = paletteForTable(table.id);

  // Slim guestMap to only firstName/lastName for the diagram
  const diagramGuestMap: Record<string, { firstName: string; lastName: string }> =
    Object.fromEntries(
      Object.entries(guestMap).map(([id, g]) => [id, { firstName: g.firstName, lastName: g.lastName }])
    );

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border shadow-apple-sm overflow-hidden",
        palette.bg,
        palette.border
      )}
    >
      {/* Card header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 border-b",
          palette.header,
          palette.border
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {table.shape === "ROUND" ? (
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="6" stroke={palette.dot} strokeWidth="2" fill={palette.dot} fillOpacity="0.2" />
            </svg>
          ) : (
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden>
              <rect x="2" y="4" width="12" height="8" rx="2" stroke={palette.dot} strokeWidth="2" fill={palette.dot} fillOpacity="0.2" />
            </svg>
          )}
          <span className={cn("text-sm font-semibold truncate", palette.text)}>
            {table.name}
          </span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className={cn(
              "p-1.5 rounded-lg transition-colors opacity-60 hover:opacity-100 hover:bg-white/60",
              palette.text
            )}
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

      {/* Interactive table diagram — click a seat to assign/unassign */}
      <div className="px-6 pt-4 pb-2 flex justify-center">
        <div className="w-28 h-28">
          <TableDiagram
            shape={table.shape}
            capacity={capacity}
            seatPositions={table.seatPositions}
            guestMap={diagramGuestMap}
            dotColor={palette.dot}
            surfaceHex={palette.surfaceHex}
            onSeatClick={onClickSeat}
          />
        </div>
      </div>

      {/* Capacity bar */}
      <div className="px-4 pt-1 pb-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className={cn("text-xs font-medium opacity-80", isFull ? "text-amber-600" : palette.text)}>
            {used} / {capacity} seats
          </span>
          {isFull && (
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
              Full ✓
            </span>
          )}
        </div>
        <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", isFull ? "bg-amber-400" : "")}
            style={{
              width: `${pct * 100}%`,
              backgroundColor: isFull ? undefined : palette.dot,
            }}
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
              "flex flex-wrap gap-1.5 min-h-[52px] px-4 pb-4 pt-2 transition-colors rounded-b-2xl",
              snapshot.isDraggingOver
                ? cn(palette.header, "ring-2 ring-inset", palette.ring)
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
              <p className={cn("text-xs w-full text-center pt-1 select-none opacity-40", palette.text)}>
                Drop guests here ↓
              </p>
            )}
          </div>
        )}
      </Droppable>

      {/* Notes */}
      {table.notes && (
        <p className={cn("px-4 pb-3 text-xs italic border-t pt-2 opacity-60", palette.text, palette.border)}>
          {table.notes}
        </p>
      )}
    </div>
  );
}
