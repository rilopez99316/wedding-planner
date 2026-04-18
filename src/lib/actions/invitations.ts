"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendInvitationEmail, sendReminderEmail } from "@/lib/email";
import { sendInvitationSms, sendReminderSms } from "@/lib/sms";
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
    where: {
      id: { in: guestIds },
      weddingId: wedding.id,
      OR: [{ email: { not: null } }, { phone: { not: null } }],
    },
    include: { group: true },
  });

  const results = { sent: 0, errors: [] as string[] };

  for (const guest of guests) {
    try {
      // Generate token atomically — only writes when the field is still null,
      // so concurrent calls for the same guest converge on a single token.
      let token = guest.invitationToken;
      if (!token) {
        const newToken = nanoid(21);
        // Atomic write: only sets the token when it is still null.
        // If a concurrent call already set it, the count will be 0 and we re-fetch.
        const { count } = await db.guest.updateMany({
          where: { id: guest.id, invitationToken: null },
          data:  { invitationToken: newToken },
        });
        token = count > 0
          ? newToken
          : (await db.guest.findUniqueOrThrow({ where: { id: guest.id }, select: { invitationToken: true } })).invitationToken!;
      }

      const guestName = `${guest.firstName} ${guest.lastName}`;
      const coupleNames = `${wedding.partner1Name} & ${wedding.partner2Name}`;

      if (guest.email) {
        await sendInvitationEmail({
          to:          guest.email,
          guestName,
          coupleNames,
          weddingDate: wedding.weddingDate,
          venueName:   wedding.venueName,
          slug:        wedding.slug,
          token,
        });
      }

      if (guest.phone) {
        await sendInvitationSms({
          to:          guest.phone,
          guestName,
          coupleNames,
          slug:        wedding.slug,
          token,
        });
      }

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
      weddingId:        wedding.id,
      invitationSentAt: { not: null },
      invitationToken:  { not: null },
      isPlusOne:        false,
      group:            { rsvpResponse: null },
      OR: [{ email: { not: null } }, { phone: { not: null } }],
    },
    include: { group: true },
  });

  const results = { sent: 0, errors: [] as string[] };

  for (const guest of guests) {
    try {
      const guestName = `${guest.firstName} ${guest.lastName}`;
      const coupleNames = `${wedding.partner1Name} & ${wedding.partner2Name}`;

      if (guest.email) {
        await sendReminderEmail({
          to:           guest.email,
          guestName,
          coupleNames,
          rsvpDeadline: wedding.rsvpDeadline,
          slug:         wedding.slug,
          token:        guest.invitationToken!,
        });
      }

      if (guest.phone) {
        await sendReminderSms({
          to:           guest.phone,
          guestName,
          coupleNames,
          rsvpDeadline: wedding.rsvpDeadline,
          slug:         wedding.slug,
          token:        guest.invitationToken!,
        });
      }

      results.sent++;
    } catch (err) {
      results.errors.push(`${guest.firstName} ${guest.lastName}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  revalidatePath("/dashboard/invitations");
  return results;
}
