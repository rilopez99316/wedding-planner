"use client";

import { WeddingPartyMember, WeddingPartyRole, WeddingPartySide } from "@prisma/client";
import { DraggableProvided } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";

export const ROLE_LABEL: Record<WeddingPartyRole, string> = {
  MOH:             "Maid of Honor",
  BRIDESMAID:      "Bridesmaid",
  BEST_MAN:        "Best Man",
  GROOMSMAN:       "Groomsman",
  FLOWER_GIRL:     "Flower Girl",
  RING_BEARER:     "Ring Bearer",
  PARENT_OF_BRIDE: "Parent of Bride",
  PARENT_OF_GROOM: "Parent of Groom",
  OFFICIANT:       "Officiant",
  OTHER:           "Other",
};

export const ROLE_ICON: Record<WeddingPartyRole, string> = {
  MOH:             "💍",
  BRIDESMAID:      "💐",
  BEST_MAN:        "🤵",
  GROOMSMAN:       "👔",
  FLOWER_GIRL:     "🌸",
  RING_BEARER:     "💒",
  PARENT_OF_BRIDE: "🌹",
  PARENT_OF_GROOM: "🌿",
  OFFICIANT:       "📖",
  OTHER:           "✨",
};

const ROLE_STYLE: Record<WeddingPartyRole, { bg: string; text: string }> = {
  MOH:             { bg: "bg-rose-50",   text: "text-rose-700" },
  BRIDESMAID:      { bg: "bg-pink-50",   text: "text-pink-700" },
  BEST_MAN:        { bg: "bg-blue-50",   text: "text-blue-700" },
  GROOMSMAN:       { bg: "bg-sky-50",    text: "text-sky-700" },
  FLOWER_GIRL:     { bg: "bg-violet-50", text: "text-violet-700" },
  RING_BEARER:     { bg: "bg-purple-50", text: "text-purple-700" },
  PARENT_OF_BRIDE: { bg: "bg-amber-50",  text: "text-amber-700" },
  PARENT_OF_GROOM: { bg: "bg-amber-50",  text: "text-amber-800" },
  OFFICIANT:       { bg: "bg-emerald-50",text: "text-emerald-700" },
  OTHER:           { bg: "bg-gray-100",  text: "text-gray-600" },
};

const SIDE_LABEL: Record<WeddingPartySide, string> = {
  BRIDE: "Bride's",
  GROOM: "Groom's",
  BOTH:  "Both Sides",
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface WeddingPartyMemberCardProps {
  member:         WeddingPartyMember;
  provided:       DraggableProvided;
  onEdit:         (member: WeddingPartyMember) => void;
  onDelete:       (id: string) => void;
  onTogglePublic: (id: string, isPublic: boolean) => void;
}

export default function WeddingPartyMemberCard({
  member,
  provided,
  onEdit,
  onDelete,
  onTogglePublic,
}: WeddingPartyMemberCardProps) {
  const roleStyle = ROLE_STYLE[member.role];

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      className={cn(
        "card group relative flex flex-col items-center text-center p-5 gap-3 transition-all duration-200",
        "hover:shadow-apple-lg hover:-translate-y-0.5",
        !member.isPublic && "opacity-60 ring-1 ring-dashed ring-gray-300"
      )}
    >
      {/* Drag handle — hover-revealed */}
      <div
        {...provided.dragHandleProps}
        className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500"
        title="Drag to reorder"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <circle cx="4" cy="3" r="1.2" />
          <circle cx="4" cy="7" r="1.2" />
          <circle cx="4" cy="11" r="1.2" />
          <circle cx="10" cy="3" r="1.2" />
          <circle cx="10" cy="7" r="1.2" />
          <circle cx="10" cy="11" r="1.2" />
        </svg>
      </div>

      {/* Visibility badge */}
      {!member.isPublic && (
        <div className="absolute top-3 right-3">
          <span className="text-[10px] text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">Hidden</span>
        </div>
      )}

      {/* Photo / Initials */}
      <div className="relative mt-2">
        {member.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.photoUrl}
            alt={member.name}
            className="w-20 h-20 rounded-full object-cover shadow-apple-sm ring-2 ring-white"
          />
        ) : (
          <div
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center ring-2 ring-white shadow-apple-sm",
              "text-xl font-semibold",
              roleStyle.bg,
              roleStyle.text
            )}
          >
            {getInitials(member.name)}
          </div>
        )}
      </div>

      {/* Name */}
      <div className="flex flex-col gap-1 min-w-0 w-full">
        <p className="text-[15px] font-semibold text-gray-900 truncate">{member.name}</p>

        {/* Role + Side badges */}
        <div className="flex items-center justify-center flex-wrap gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full text-[11px] font-medium px-2 py-0.5",
              roleStyle.bg,
              roleStyle.text
            )}
          >
            {ROLE_ICON[member.role]} {ROLE_LABEL[member.role]}
          </span>
          <span className="inline-flex items-center rounded-full text-[11px] font-medium px-2 py-0.5 bg-gray-100 text-gray-500">
            {SIDE_LABEL[member.side]}
          </span>
        </div>

        {/* Contact line */}
        {(member.email || member.phone) && (
          <p className="text-[12px] text-gray-400 truncate">
            {member.email || member.phone}
          </p>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-1 pt-1 border-t border-gray-100 w-full justify-center">
        {/* Visibility toggle */}
        <button
          onClick={() => onTogglePublic(member.id, !member.isPublic)}
          title={member.isPublic ? "Hide from public page" : "Show on public page"}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          {member.isPublic ? (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
            </svg>
          )}
        </button>

        {/* Edit */}
        <button
          onClick={() => onEdit(member)}
          title="Edit member"
          className="p-1.5 rounded-md text-gray-400 hover:text-accent hover:bg-accent-light transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        {/* Delete */}
        <button
          onClick={() => {
            if (confirm(`Remove ${member.name} from the wedding party?`)) {
              onDelete(member.id);
            }
          }}
          title="Remove member"
          className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
