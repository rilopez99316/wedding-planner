import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { sendConfirmationEmail } from "@/lib/email";

const rsvpSchema = z.object({
  plusOneAttending: z.boolean(),
  plusOneName:      z.string().optional(),
  eventAttendance:  z.array(z.object({ eventKey: z.string(), attending: z.boolean() })),
  dietary:          z.array(z.object({
    guestId:     z.string(),
    restrictions: z.array(z.string()),
    otherNotes:  z.string().optional(),
  })),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  const guest = await db.guest.findUnique({
    where:   { invitationToken: token },
    include: {
      group: { include: { wedding: true, rsvpResponse: true } },
    },
  });

  if (!guest) {
    return NextResponse.json({ error: "Invalid RSVP link." }, { status: 404 });
  }

  const body = await req.json();
  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  const data = parsed.data;
  const wedding = guest.group.wedding;

  // Fetch group guest IDs before the transaction (read-only, no contention)
  const groupGuestIds = new Set(
    (await db.guest.findMany({ where: { groupId: guest.groupId }, select: { id: true } }))
      .map((g) => g.id)
  );

  // Upsert RSVP and dietary restrictions atomically
  const rsvp = await db.$transaction(async (tx) => {
    const rsvpRecord = await tx.rsvpResponse.upsert({
      where:  { groupId: guest.groupId },
      create: {
        groupId:          guest.groupId,
        plusOneAttending: data.plusOneAttending,
        plusOneName:      data.plusOneName || null,
        eventResponses: {
          create: data.eventAttendance.map((e) => ({
            eventKey:  e.eventKey,
            attending: e.attending,
          })),
        },
      },
      update: {
        plusOneAttending: data.plusOneAttending,
        plusOneName:      data.plusOneName || null,
        updatedAt:        new Date(),
        eventResponses: {
          deleteMany: {},
          create: data.eventAttendance.map((e) => ({
            eventKey:  e.eventKey,
            attending: e.attending,
          })),
        },
      },
    });

    for (const d of data.dietary) {
      if (!groupGuestIds.has(d.guestId)) continue;
      await tx.dietaryRestriction.deleteMany({ where: { guestId: d.guestId } });
      if (d.restrictions.length > 0) {
        await tx.dietaryRestriction.createMany({
          data: d.restrictions.map((r) => ({
            guestId:    d.guestId,
            restriction: r,
            notes:      d.otherNotes || null,
          })),
        });
      }
    }

    return rsvpRecord;
  });

  // Send confirmation email — non-fatal, RSVP already committed
  if (guest.email) {
    const attending = data.eventAttendance.some((e) => e.attending);
    try {
      await sendConfirmationEmail({
        to:          guest.email,
        guestName:   `${guest.firstName} ${guest.lastName}`,
        coupleNames: `${wedding.partner1Name} & ${wedding.partner2Name}`,
        weddingDate: wedding.weddingDate,
        attending,
      });
    } catch {
      // Non-fatal — RSVP is saved even if email fails
    }
  }

  return NextResponse.json({ success: true, rsvpId: rsvp.id });
}
