import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import SeatingClient from "@/components/dashboard/SeatingClient";
import type { ClientGuest, ClientTable } from "@/lib/types/seating";

export default async function SeatingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const wedding = await db.wedding.findFirst({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      seatingTables: {
        orderBy: { sortOrder: "asc" },
        include: {
          assignments: {
            select: { guestId: true },
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

  const tables: ClientTable[] = wedding.seatingTables.map((t) => ({
    id:        t.id,
    name:      t.name,
    capacity:  t.capacity,
    shape:     t.shape,
    notes:     t.notes,
    sortOrder: t.sortOrder,
    guestIds:  t.assignments.map((a) => a.guestId),
  }));

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
