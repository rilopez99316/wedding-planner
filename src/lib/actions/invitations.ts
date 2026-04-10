"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendInvitationEmail, sendReminderEmail } from "@/lib/email";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

async function getWeddingForUser(userId: string) {
  const wedding = await db.wedding.findFirst({ where: { ownerId: userId } });
  if (!wedding) throw new Error("Wedding not found.");
  return wedding;
}

export async function sendInvitationsAction(guestIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const guests = await db.guest.findMany({
    where: { id: { in: guestIds }, weddingId: wedding.id, email: { not: null } },
    include: { group: true },
  });

  const results = { sent: 0, errors: [] as string[] };

  for (const guest of guests) {
    try {
      // Generate token if none exists
      const token = guest.invitationToken ?? nanoid(21);
      if (!guest.invitationToken) {
        await db.guest.update({ where: { id: guest.id }, data: { invitationToken: token } });
      }

      await sendInvitationEmail({
        to:          guest.email!,
        guestName:   `${guest.firstName} ${guest.lastName}`,
        coupleNames: `${wedding.partner1Name} & ${wedding.partner2Name}`,
        weddingDate: wedding.weddingDate,
        venueName:   wedding.venueName,
        slug:        wedding.slug,
        token,
      });

      await db.guest.update({
        where: { id: guest.id },
        data:  { invitationSentAt: new Date() },
      });

      results.sent++;
    } catch (err) {
      results.errors.push(`${guest.firstName} ${guest.lastName}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  revalidatePath("/dashboard/invitations");
  revalidatePath("/dashboard/guests");
  return results;
}

export async function sendRemindersAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  // Find all primary guests who were invited but whose group hasn't responded
  const guests = await db.guest.findMany({
    where: {
      weddingId:       wedding.id,
      email:           { not: null },
      invitationSentAt: { not: null },
      invitationToken:  { not: null },
      isPlusOne:        false,
      group:            { rsvpResponse: null },
    },
    include: { group: true },
  });

  const results = { sent: 0, errors: [] as string[] };

  for (const guest of guests) {
    try {
      await sendReminderEmail({
        to:           guest.email!,
        guestName:    `${guest.firstName} ${guest.lastName}`,
        coupleNames:  `${wedding.partner1Name} & ${wedding.partner2Name}`,
        rsvpDeadline: wedding.rsvpDeadline,
        slug:         wedding.slug,
        token:        guest.invitationToken!,
      });
      results.sent++;
    } catch (err) {
      results.errors.push(`${guest.firstName} ${guest.lastName}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  revalidatePath("/dashboard/invitations");
  return results;
}
