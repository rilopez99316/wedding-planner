"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import EditGuestDialog from "@/components/dashboard/EditGuestDialog";
import { deleteGuestGroupAction } from "@/lib/actions/guests";
import type { GuestGroup, Guest, RsvpResponse, WeddingEvent, GuestGroupEvent } from "@prisma/client";

type GuestGroupWithRelations = GuestGroup & {
  guests: Guest[];
  rsvpResponse: RsvpResponse | null;
  allowedEvents: (GuestGroupEvent & { event: WeddingEvent })[];
};

interface GuestTableProps {
  groups: GuestGroupWithRelations[];
  events: WeddingEvent[];
  weddingId: string;
}

function RsvpStatusBadge({ response }: { response: RsvpResponse | null }) {
  if (!response) return <Badge variant="default">Awaiting</Badge>;
  return <Badge variant="success">Responded</Badge>;
}

function InvitationBadge({ sentAt }: { sentAt: Date | null }) {
  if (!sentAt) return <Badge variant="default">Not sent</Badge>;
  return <Badge variant="accent">Invited</Badge>;
}

export default function GuestTable({ groups, events, weddingId }: GuestTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(groupId: string, groupName: string) {
    if (!confirm(`Remove "${groupName}" and all their data? This cannot be undone.`)) return;
    setDeletingId(groupId);
    await deleteGuestGroupAction(groupId);
    router.refresh();
    setDeletingId(null);
  }

  return (
    <div className="bg-white rounded-lg shadow-apple-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <span>Group / Guests</span>
        <span>Tier</span>
        <span>Invitation</span>
        <span>RSVP</span>
        <span></span>
      </div>

      <div className="divide-y divide-gray-100">
        {groups.map((group) => {
          const primaryGuest = group.guests.find((g) => !g.isPlusOne);
          const hasInvitation = group.guests.some((g) => g.invitationSentAt);

          return (
            <div
              key={group.id}
              className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto_auto] gap-3 sm:gap-4 px-4 py-3.5 items-center hover:bg-gray-50/50 transition-colors"
            >
              {/* Group info */}
              <div>
                <div className="font-medium text-sm text-gray-900">{group.groupName}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {group.guests.map((g) => `${g.firstName} ${g.lastName}`).join(", ")}
                  {primaryGuest?.email && (
                    <span className="ml-2 text-gray-300">· {primaryGuest.email}</span>
                  )}
                </div>
              </div>

              {/* Tier */}
              <div>
                <Badge variant={group.invitationTier === "A" ? "accent" : "default"}>
                  {group.invitationTier}-list
                </Badge>
              </div>

              {/* Invitation status */}
              <div>
                <InvitationBadge sentAt={primaryGuest?.invitationSentAt ?? null} />
              </div>

              {/* RSVP status */}
              <div>
                <RsvpStatusBadge response={group.rsvpResponse} />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <EditGuestDialog group={group} events={events}>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-accent hover:bg-accent-light transition-colors"
                    title="Edit group"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </EditGuestDialog>
                <button
                  onClick={() => handleDelete(group.id, group.groupName)}
                  disabled={deletingId === group.id}
                  className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Remove group"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
