"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { Resend } from "resend";
import twilio from "twilio";

const REVALIDATE_PATH = "/dashboard/communications";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `${process.env.RESEND_FROM_NAME ?? "Vows"} <${process.env.RESEND_FROM_EMAIL ?? "noreply@vows.app"}>`;

function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (
    !sid ||
    !token ||
    !sid.startsWith("AC") ||
    sid === "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  ) {
    return null;
  }
  return twilio(sid, token);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getWeddingForUser(userId: string) {
  const wedding = await db.wedding.findFirst({ where: { ownerId: userId } });
  if (!wedding) throw new Error("Wedding not found.");
  return wedding;
}

async function resolveRecipients(
  weddingId: string,
  filter: string,
  channel: "email" | "sms"
) {
  const contactField = channel === "email" ? "email" : "phone";

  const whereBase = {
    weddingId,
    isPlusOne: false,
    [contactField]: { not: null },
  };

  const rsvpFilter =
    filter === "attending"
      ? { group: { rsvpResponse: { isNot: null } } }
      : filter === "not_responded"
      ? { group: { rsvpResponse: null } }
      : filter === "declined"
      ? { group: { rsvpResponse: { is: { eventResponses: { none: { attending: true } } } } } }
      : {};

  const guests = await db.guest.findMany({
    where: { ...whereBase, ...rsvpFilter },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  });

  return guests;
}

function buildEmailHtml(guestName: string, body: string, coupleNames: string) {
  const paragraphs = body
    .split("\n")
    .filter((l) => l.trim())
    .map(
      (l) =>
        `<p style="margin:0 0 14px;line-height:1.7;color:#262626;font-size:15px;">${l}</p>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="background:#F5F5F7;margin:0;padding:40px 16px;font-family:-apple-system,BlinkMacSystemFont,'Inter',Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#1B2A4A;padding:36px 44px;text-align:center;">
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;color:#F5E6C8;letter-spacing:0.06em;">${coupleNames}</p>
    </div>
    <div style="padding:40px 44px;">
      <p style="margin:0 0 24px;color:#8E8E93;font-size:13px;letter-spacing:0.02em;">Dear ${guestName},</p>
      ${paragraphs}
      <p style="margin:28px 0 0;color:#8E8E93;font-size:13px;">With love,<br><span style="color:#1B2A4A;font-family:Georgia,serif;">${coupleNames}</span></p>
    </div>
    <div style="background:#F5F5F7;padding:18px 44px;text-align:center;border-top:1px solid #E5E5EA;">
      <p style="margin:0;font-size:11px;color:#AEAEB2;letter-spacing:0.03em;">Sent with care via Vows Wedding Planner</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const messageSchema = z.object({
  subject: z.string().max(200).optional().nullable(),
  body: z.string().min(1, "Message body is required").max(5000),
  channel: z.enum(["email", "sms"]),
  recipientFilter: z
    .enum(["all", "attending", "not_responded", "declined"])
    .default("all"),
  scheduledAt: z.string().optional().nullable(),
});

export type MessageInput = z.infer<typeof messageSchema>;

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function saveDraftAction(input: MessageInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const wedding = await getWeddingForUser(session.user.id);
  const recipients = await resolveRecipients(
    wedding.id,
    parsed.data.recipientFilter,
    parsed.data.channel
  );

  await db.guestMessage.create({
    data: {
      weddingId: wedding.id,
      subject: parsed.data.subject ?? null,
      body: parsed.data.body,
      channel: parsed.data.channel,
      status: "draft",
      recipientFilter: parsed.data.recipientFilter,
      recipientCount: recipients.length,
    },
  });

  revalidatePath(REVALIDATE_PATH);
}

export async function sendMessageAction(input: MessageInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  if (parsed.data.channel === "email" && !parsed.data.subject?.trim()) {
    throw new Error("Subject line is required for email messages.");
  }

  const wedding = await getWeddingForUser(session.user.id);
  const recipients = await resolveRecipients(
    wedding.id,
    parsed.data.recipientFilter,
    parsed.data.channel
  );

  if (recipients.length === 0) {
    throw new Error(
      "No recipients found for the selected filter and channel. Make sure your guests have the relevant contact info."
    );
  }

  const coupleNames = `${wedding.partner1Name} & ${wedding.partner2Name}`;

  // Create the record in "sending" state
  const message = await db.guestMessage.create({
    data: {
      weddingId: wedding.id,
      subject: parsed.data.subject ?? null,
      body: parsed.data.body,
      channel: parsed.data.channel,
      status: "sending",
      recipientFilter: parsed.data.recipientFilter,
      recipientCount: recipients.length,
    },
  });

  // Dispatch
  let totalSent = 0;
  let totalFailed = 0;

  if (parsed.data.channel === "email") {
    const results = await Promise.allSettled(
      recipients.map((r) =>
        resend.emails.send({
          from: FROM,
          to: r.email!,
          subject: parsed.data.subject!,
          html: buildEmailHtml(
            `${r.firstName} ${r.lastName}`,
            parsed.data.body,
            coupleNames
          ),
        })
      )
    );
    totalSent = results.filter((r) => r.status === "fulfilled").length;
    totalFailed = results.filter((r) => r.status === "rejected").length;
  } else {
    const client = getTwilioClient();
    if (!client) throw new Error("SMS is not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.");
    const from = process.env.TWILIO_PHONE_NUMBER ?? "";

    const results = await Promise.allSettled(
      recipients.map((r) =>
        client.messages.create({ body: parsed.data.body, from, to: r.phone! })
      )
    );
    totalSent = results.filter((r) => r.status === "fulfilled").length;
    totalFailed = results.filter((r) => r.status === "rejected").length;
  }

  const finalStatus =
    totalSent > 0 ? "sent" : totalFailed > 0 ? "failed" : "sent";

  await db.guestMessage.update({
    where: { id: message.id },
    data: {
      status: finalStatus,
      sentAt: new Date(),
      totalSent,
      totalFailed,
    },
  });

  revalidatePath(REVALIDATE_PATH);
}

export async function scheduleMessageAction(
  input: MessageInput & { scheduledAt: string }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  if (!input.scheduledAt) throw new Error("Scheduled time is required.");

  const scheduledDate = new Date(input.scheduledAt);
  if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    throw new Error("Scheduled time must be in the future.");
  }

  if (parsed.data.channel === "email" && !parsed.data.subject?.trim()) {
    throw new Error("Subject line is required for email messages.");
  }

  const wedding = await getWeddingForUser(session.user.id);
  const recipients = await resolveRecipients(
    wedding.id,
    parsed.data.recipientFilter,
    parsed.data.channel
  );

  await db.guestMessage.create({
    data: {
      weddingId: wedding.id,
      subject: parsed.data.subject ?? null,
      body: parsed.data.body,
      channel: parsed.data.channel,
      status: "scheduled",
      recipientFilter: parsed.data.recipientFilter,
      recipientCount: recipients.length,
      scheduledAt: scheduledDate,
    },
  });

  revalidatePath(REVALIDATE_PATH);
}

export async function deleteMessageAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const existing = await db.guestMessage.findUnique({ where: { id } });
  if (!existing || existing.weddingId !== wedding.id) {
    throw new Error("Message not found.");
  }

  await db.guestMessage.delete({ where: { id } });
  revalidatePath(REVALIDATE_PATH);
}

export async function resendMessageAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const existing = await db.guestMessage.findUnique({ where: { id } });
  if (!existing || existing.weddingId !== wedding.id) {
    throw new Error("Message not found.");
  }
  if (existing.status !== "failed") {
    throw new Error("Only failed messages can be resent.");
  }

  const coupleNames = `${wedding.partner1Name} & ${wedding.partner2Name}`;
  const recipients = await resolveRecipients(
    wedding.id,
    existing.recipientFilter,
    existing.channel as "email" | "sms"
  );

  await db.guestMessage.update({
    where: { id },
    data: { status: "sending", totalFailed: 0, totalSent: 0 },
  });

  let totalSent = 0;
  let totalFailed = 0;

  if (existing.channel === "email") {
    const results = await Promise.allSettled(
      recipients.map((r) =>
        resend.emails.send({
          from: FROM,
          to: r.email!,
          subject: existing.subject ?? `A message from ${coupleNames}`,
          html: buildEmailHtml(
            `${r.firstName} ${r.lastName}`,
            existing.body,
            coupleNames
          ),
        })
      )
    );
    totalSent = results.filter((r) => r.status === "fulfilled").length;
    totalFailed = results.filter((r) => r.status === "rejected").length;
  } else {
    const client = getTwilioClient();
    if (!client) throw new Error("SMS is not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.");
    const from = process.env.TWILIO_PHONE_NUMBER ?? "";

    const results = await Promise.allSettled(
      recipients.map((r) =>
        client.messages.create({ body: existing.body, from, to: r.phone! })
      )
    );
    totalSent = results.filter((r) => r.status === "fulfilled").length;
    totalFailed = results.filter((r) => r.status === "rejected").length;
  }

  await db.guestMessage.update({
    where: { id },
    data: {
      status: totalSent > 0 ? "sent" : "failed",
      sentAt: new Date(),
      totalSent,
      totalFailed,
    },
  });

  revalidatePath(REVALIDATE_PATH);
}
