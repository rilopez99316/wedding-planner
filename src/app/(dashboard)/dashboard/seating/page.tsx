import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import SeatingClient from "@/components/dashboard/SeatingClient";
import type { ClientGuest, ClientTable, SeatPosition } from "@/lib/types/seating";

export default async function SeatingPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const wedding = await db.wedding.findFirst({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      seatingTables: {
        orderBy: { sortOrder: "asc" },
        include: {
          assignments: {
            select: { guestId: true, seatNumber: true },
          },
        },
      },
      guestGroups: {
        include: {
          guests: {
            include: { dietaryRestrictions: true },
          },
          rsvpResponse: {
            include: { eventResponses: true },
          },
        },
      },
    },
  });

  if (!wedding) redirect("/dashboard");

  // ── Filter confirmed attending guests ──────────────────────────────────────
  // A guest is confirmed if:
  //   1. Their group has an RsvpResponse
  //   2. At least one EventResponse in that response has attending: true
  //   3. Plus-ones require rsvpResponse.plusOneAttending === true

  const confirmedGuests: ClientGuest[] = [];

  for (const group of wedding.guestGroups) {
    const rsvp = group.rsvpResponse;
    if (!rsvp) continue;
    const groupAttends = rsvp.eventResponses.some((er) => er.attending);
    if (!groupAttends) continue;

    for (const guest of group.guests) {
      if (guest.isPlusOne && !rsvp.plusOneAttending) continue;
      confirmedGuests.push({
        id:                  guest.id,
        firstName:           guest.firstName,
        lastName:            guest.lastName,
        groupId:             group.id,
        groupName:           group.groupName,
        isPlusOne:           guest.isPlusOne,
        dietaryRestrictions: guest.dietaryRestrictions.map((d) => ({
          restriction: d.restriction,
          notes:       d.notes,
        })),
      });
    }
  }

  // ── Build client tables ───────────────────────────────────────────────────

  const tables: ClientTable[] = wedding.seatingTables.map((t) => {
    const guestIds = t.assignments.map((a) => a.guestId);

    // Build seatPositions: guests with explicit seatNumber keep their spot;
    // guests assigned via DnD (seatNumber = null) fill remaining slots in order.
    const explicit: SeatPosition[] = [];
    const implicit: string[]       = [];

    for (const a of t.assignments) {
      if (a.seatNumber !== null) {
        explicit.push({ seatNumber: a.seatNumber, guestId: a.guestId });
      } else {
        implicit.push(a.guestId);
      }
    }

    const usedSeats = new Set(explicit.map((e) => e.seatNumber));
    const seatPositions: SeatPosition[] = [...explicit];
    let next = 1;
    for (const guestId of implicit) {
      while (usedSeats.has(next)) next++;
      seatPositions.push({ seatNumber: next, guestId });
      usedSeats.add(next);
      next++;
    }
    seatPositions.sort((a, b) => a.seatNumber - b.seatNumber);

    return {
      id:            t.id,
      name:          t.name,
      capacity:      t.capacity,
      shape:         t.shape,
      notes:         t.notes,
      sortOrder:     t.sortOrder,
      guestIds,
      seatPositions,
    };
  });

  // ── Maps / counts ─────────────────────────────────────────────────────────

  const guestMap = Object.fromEntries(confirmedGuests.map((g) => [g.id, g]));
  const seatedGuestIds = tables.flatMap((t) => t.guestIds);
  const seatedCount    = new Set(seatedGuestIds).size;
  const totalCount     = confirmedGuests.length;

  return (
    <DashboardShell
      heading="Seating Chart"
      subheading={
        totalCount === 0
          ? "Confirmed RSVPs will appear here"
          : `${seatedCount} of ${totalCount} confirmed guests seated`
      }
    >
      <SeatingClient
        weddingId={wedding.id}
        tables={tables}
        confirmedGuests={confirmedGuests}
        guestMap={guestMap}
        seatedGuestIds={seatedGuestIds}
      />
    </DashboardShell>
  );
}
