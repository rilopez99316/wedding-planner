"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import FadeIn from "@/components/ui/FadeIn";
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

// ── KPI Bar ───────────────────────────────────────────────────────────────────

function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * pct) / 100;
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0">
      <circle cx="22" cy="22" r={r} fill="none" stroke="#F2F2F2" strokeWidth="3" />
      <circle
        cx="22" cy="22" r={r} fill="none"
        stroke={color} strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 22 22)"
        style={{ transition: "stroke-dashoffset 0.7s ease-out" }}
      />
    </svg>
  );
}

function GuestKpiBar({ groups }: { groups: GuestGroupWithRelations[] }) {
  const total = groups.length;
  const invited = groups.filter((g) => g.guests.some((gu) => gu.invitationSentAt)).length;
  const responded = groups.filter((g) => g.rsvpResponse).length;
  const invitedPct = total > 0 ? Math.round((invited / total) * 100) : 0;
  const respondedPct = total > 0 ? Math.round((responded / total) * 100) : 0;

  return (
    <FadeIn direction="up" delay={0}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {/* Total Groups */}
        <div className="bg-[#FDFCFB] rounded-xl border border-gray-100 border-t-2 border-t-blue-400 shadow-apple-sm px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Total Groups</p>
          <p className="font-serif text-4xl font-light text-gray-900 tabular-nums leading-none">{total}</p>
          <p className="text-xs text-gray-400 mt-1.5">{groups.reduce((s, g) => s + g.guests.length, 0)} guests</p>
        </div>

        {/* Invited % */}
        <div className="bg-[#FDFCFB] rounded-xl border border-gray-100 border-t-2 border-t-blue-400 shadow-apple-sm px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Invited</p>
            <p className="font-serif text-4xl font-light text-gray-900 tabular-nums leading-none">{invitedPct}%</p>
            <p className="text-xs text-gray-400 mt-1.5">{invited} of {total}</p>
          </div>
          <ProgressRing pct={invitedPct} color="#0071E3" />
        </div>

        {/* RSVP % */}
        <div className="bg-[#FDFCFB] rounded-xl border border-gray-100 border-t-2 border-t-green-400 shadow-apple-sm px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">RSVP&apos;d</p>
            <p className="font-serif text-4xl font-light text-gray-900 tabular-nums leading-none">{respondedPct}%</p>
            <p className="text-xs text-gray-400 mt-1.5">{responded} of {total}</p>
          </div>
          <ProgressRing pct={respondedPct} color="#16A34A" />
        </div>
      </div>
    </FadeIn>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function GuestAvatar({ name, tier }: { name: string; tier: string }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
        tier === "A" ? "bg-accent-light text-accent" : "bg-gray-100 text-gray-500"
      )}
      style={tier === "A" ? {
        boxShadow: "0 0 0 1px #fff, 0 0 0 2px rgba(201,168,76,0.35)"
      } : undefined}
    >
      {initials}
    </div>
  );
}

// ── Status Chips ──────────────────────────────────────────────────────────────

function InvitationChip({ sentAt }: { sentAt: Date | null }) {
  const sent = !!sentAt;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-0.5 border",
      sent
        ? "bg-accent-light text-accent border-accent/20"
        : "bg-gray-100 text-gray-500 border-gray-200"
    )}>
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      {sent ? "Invited" : "Not sent"}
    </span>
  );
}

function RsvpChip({ response }: { response: RsvpResponse | null }) {
  const responded = !!response;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-0.5 border",
      responded
        ? "bg-green-50 text-green-700 border-green-200"
        : "bg-amber-50 text-amber-700 border-amber-200"
    )}>
      {responded ? (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {responded ? "Responded" : "Awaiting"}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function GuestTable({ groups, events, weddingId }: GuestTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function handleDelete(groupId: string) {
    setDeletingId(groupId);
    await deleteGuestGroupAction(groupId);
    setConfirmDeleteId(null);
    router.refresh();
    setDeletingId(null);
  }

  return (
    <div>
      <GuestKpiBar groups={groups} />

      {/* Section heading */}
      <div className="flex items-center gap-4 mb-4 mt-2">
        <h3 className="font-serif font-light text-base text-gray-900 whitespace-nowrap">
          {groups.length} {groups.length === 1 ? "group" : "groups"}
        </h3>
        <div
          className="flex-1 h-px"
          style={{ background: "linear-gradient(to right, rgba(201,168,76,0.35), transparent)" }}
        />
      </div>

      <div>
        {groups.map((group, index) => {
          const primaryGuest = group.guests.find((g) => !g.isPlusOne);
          const hasInvitation = group.guests.some((g) => g.invitationSentAt);
          const isConfirmingDelete = confirmDeleteId === group.id;

          return (
            <FadeIn key={group.id} direction="up" delay={index * 0.03}>
              <div className={cn(
                "group relative bg-[#FDFCFB] rounded-xl border border-gray-100 shadow-apple-sm hover:shadow-apple-md hover:bg-white transition-all duration-200 overflow-hidden mb-2",
              )}>
                {/* Gold left strip — A-list only */}
                {group.invitationTier === "A" && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-0.5 opacity-50 group-hover:opacity-80 transition-opacity duration-200"
                    style={{ background: "linear-gradient(to bottom, rgba(201,168,76,0.6), rgba(201,168,76,0.15))" }}
                  />
                )}

                {/* Row content */}
                <div className="flex items-start gap-3 px-4 py-4">
                  {/* Left: avatar + info */}
                  <GuestAvatar name={group.groupName} tier={group.invitationTier} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif text-[16px] font-light text-gray-900 leading-snug">{group.groupName}</span>
                      <Badge variant={group.invitationTier === "A" ? "accent" : "default"} className="text-[10px]">
                        {group.invitationTier}-list
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {group.guests.map((g) => `${g.firstName} ${g.lastName}`).join(", ")}
                    </p>
                    {primaryGuest?.email && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-gray-400">{primaryGuest.email}</span>
                      </div>
                    )}
                    {!primaryGuest?.email && primaryGuest?.phone && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-xs text-gray-400">{primaryGuest.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Right: chips + actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end mt-0.5">
                    <InvitationChip sentAt={primaryGuest?.invitationSentAt ?? null} />
                    <RsvpChip response={group.rsvpResponse} />

                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <EditGuestDialog group={group} events={events}>
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-accent hover:bg-accent-light transition-colors"
                          title="Edit group"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </EditGuestDialog>
                      <button
                        onClick={() => setConfirmDeleteId(isConfirmingDelete ? null : group.id)}
                        disabled={deletingId === group.id}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Remove group"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline delete confirmation */}
                <AnimatePresence>
                  {isConfirmingDelete && (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-3 px-4 pb-3.5 pt-0">
                        <div className="h-px flex-1 bg-red-50" />
                        <span className="text-xs text-red-600 font-medium">Remove &ldquo;{group.groupName}&rdquo; and all their data?</span>
                        <button
                          onClick={() => handleDelete(group.id)}
                          disabled={deletingId === group.id}
                          className="text-xs bg-red-500 text-white rounded-lg px-3 py-1.5 hover:bg-red-600 transition-colors disabled:opacity-60"
                        >
                          {deletingId === group.id ? "Removing…" : "Remove"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FadeIn>
          );
        })}
      </div>
    </div>
  );
}
