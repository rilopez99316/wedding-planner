"use server";

import { db } from "@/lib/db";
import { sendConfirmationEmail } from "@/lib/email";

export interface RsvpSubmissionData {
  plusOneAttending: boolean;
  plusOneName?: string;
  eventAttendance: { eventKey: string; attending: boolean }[];
  dietary: { guestId: string; restrictions: string[]; otherNotes: string }[];
}

export async function submitRsvpAction(
  groupId: string,
  weddingId: string,
  data: RsvpSubmissionData
) {
  // Verify the group belongs to the wedding (security check)
  const group = await db.guestGroup.findFirst({
    where: { id: groupId, weddingId },
    include: {
      guests: true,
      wedding: true,
    },
  });

  if (!group) throw new Error("Guest group not found.");

  // Collect plus-one dietary notes from the "plus-one" pseudo-entry
  const plusOneDietary = data.dietary.find((d) => d.guestId === "plus-one");
  const plusOneDietaryNotes = plusOneDietary
    ? [...plusOneDietary.restrictions, plusOneDietary.otherNotes].filter(Boolean).join(", ") || null
    : null;

  // Upsert RSVP response
  const rsvp = await db.rsvpResponse.upsert({
    where: { groupId },
    create: {
      groupId,
      plusOneAttending: data.plusOneAttending,
      plusOneName: data.plusOneName || null,
      plusOneDietaryNotes,
      eventResponses: {
        create: data.eventAttendance.map((e) => ({
          eventKey: e.eventKey,
          attending: e.attending,
        })),
      },
    },
    update: {
      plusOneAttending: data.plusOneAttending,
      plusOneName: data.plusOneName || null,
      plusOneDietaryNotes,
      eventResponses: {
        deleteMany: {},
        create: data.eventAttendance.map((e) => ({
          eventKey: e.eventKey,
          attending: e.attending,
        })),
      },
    },
  });

  // Save dietary restrictions for real guests only
  const knownGuestIds = new Set(group.guests.map((g) => g.id));
  for (const d of data.dietary) {
    if (!knownGuestIds.has(d.guestId)) continue;
    await db.dietaryRestriction.deleteMany({ where: { guestId: d.guestId } });
    if (d.restrictions.length > 0) {
      await db.dietaryRestriction.createMany({
        data: d.restrictions.map((r) => ({
          guestId: d.guestId,
          restriction: r,
          notes: d.otherNotes || null,
        })),
      });
    }
  }

  // Send confirmation email to first guest with an email address
  const primaryGuest = group.guests.find((g) => g.email);
  if (primaryGuest?.email) {
    const attending = data.eventAttendance.some((e) => e.attending);
    try {
      await sendConfirmationEmail({
        to: primaryGuest.email,
        guestName: `${primaryGuest.firstName} ${primaryGuest.lastName}`,
        coupleNames: `${group.wedding.partner1Name} & ${group.wedding.partner2Name}`,
        weddingDate: group.wedding.weddingDate,
        attending,
      });
    } catch {
      // Non-fatal — RSVP is saved even if email fails
    }
  }

  return { success: true, rsvpId: rsvp.id };
}
