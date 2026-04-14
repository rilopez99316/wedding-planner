"use client";

import { DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import type { ClientGuest } from "@/lib/types/seating";
import DietaryFlag from "./DietaryFlag";
import { avatarPaletteForName } from "./seatingPalette";

interface GuestChipProps {
  guest:          ClientGuest;
  provided:       DraggableProvided;
  snapshot:       DraggableStateSnapshot;
  /** Full-width card for sidebar; compact pill inside a table */
  compact?:       boolean;
  onClickAssign?: () => void;
  onClickRemove?: () => void;
}

function initials(guest: ClientGuest) {
  return `${guest.firstName[0] ?? ""}${guest.lastName[0] ?? ""}`.toUpperCase();
}

export default function GuestChip({
  guest,
  provided,
  snapshot,
  compact = false,
  onClickAssign,
  onClickRemove,
}: GuestChipProps) {
  const avatar = avatarPaletteForName(guest.firstName, guest.lastName);

  if (compact) {
    return (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
          "bg-white border border-gray-100 shadow-apple-xs text-gray-700",
          "cursor-grab select-none transition-all duration-150",
          snapshot.isDragging && "shadow-apple-md scale-105 cursor-grabbing rotate-1"
        )}
      >
        {/* Mini avatar dot */}
        <span
          className={cn(
            "w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0",
            avatar.bg,
            avatar.text
          )}
        >
          {guest.firstName[0]?.toUpperCase()}
        </span>

        <span className="truncate max-w-[72px]">
          {guest.firstName} {guest.lastName[0]}.
        </span>

        {guest.dietaryRestrictions.slice(0, 1).map((d) => (
          <DietaryFlag key={d.restriction} restriction={d.restriction} />
        ))}

        {onClickRemove && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClickRemove(); }}
            className="ml-0.5 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label={`Remove ${guest.firstName} from table`}
          >
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  // ── Full card (sidebar) ────────────────────────────────────────────────────
  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2.5 bg-white rounded-xl border border-gray-100 shadow-apple-xs",
        "cursor-grab select-none transition-all duration-150",
        snapshot.isDragging && "shadow-apple-lg opacity-95 scale-[1.02] cursor-grabbing rotate-1"
      )}
    >
      {/* Colorful avatar with shine overlay */}
      <div
        className={cn(
          "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold relative overflow-hidden",
          avatar.bg,
          avatar.text
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
        <span className="relative">{initials(guest)}</span>
      </div>

      {/* Name + group */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {guest.firstName} {guest.lastName}
          {guest.isPlusOne && <span className="ml-1 text-gray-400 text-xs">+1</span>}
        </p>
        <p className="text-xs text-gray-400 truncate">{guest.groupName}</p>
      </div>

      {/* Dietary flags */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {guest.dietaryRestrictions.slice(0, 2).map((d) => (
          <DietaryFlag key={d.restriction} restriction={d.restriction} />
        ))}
      </div>

      {/* Assign button (accessibility fallback) */}
      {onClickAssign && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClickAssign(); }}
          className="flex-shrink-0 text-xs text-rose-500 hover:text-rose-700 font-medium focus:outline-none"
        >
          Assign
        </button>
      )}
    </div>
  );
}
