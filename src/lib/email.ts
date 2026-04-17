import { Resend } from "resend";
import { render } from "@react-email/components";
import InvitationEmail from "@/emails/invitation";
import RsvpConfirmationEmail from "@/emails/rsvp-confirmation";
import ReminderEmail from "@/emails/reminder";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `${process.env.RESEND_FROM_NAME ?? "Vows"} <${process.env.RESEND_FROM_EMAIL ?? "noreply@vows.app"}>`;
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.NODE_ENV === "production"
    ? (() => { throw new Error("NEXT_PUBLIC_APP_URL must be set in production"); })()
    : "http://localhost:3000");

export async function sendInvitationEmail({
  to,
  guestName,
  coupleNames,
  weddingDate,
  venueName,
  slug,
  token,
}: {
  to: string;
  guestName: string;
  coupleNames: string;
  weddingDate: Date;
  venueName?: string | null;
  slug: string;
  token: string;
}) {
  const rsvpUrl = `${APP_URL}/${slug}/rsvp?token=${token}`;

  const html = await render(
    InvitationEmail({ guestName, coupleNames, weddingDate, venueName, rsvpUrl })
  );

  return resend.emails.send({
    from: FROM,
    to,
    subject: `You're invited — ${coupleNames}`,
    html,
  });
}

export async function sendConfirmationEmail({
  to,
  guestName,
  coupleNames,
  weddingDate,
  attending,
}: {
  to: string;
  guestName: string;
  coupleNames: string;
  weddingDate: Date;
  attending: boolean;
}) {
  const html = await render(
    RsvpConfirmationEmail({ guestName, coupleNames, weddingDate, attending })
  );

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Your RSVP is confirmed — ${coupleNames}`,
    html,
  });
}

export async function sendReminderEmail({
  to,
  guestName,
  coupleNames,
  rsvpDeadline,
  slug,
  token,
}: {
  to: string;
  guestName: string;
  coupleNames: string;
  rsvpDeadline: Date;
  slug: string;
  token: string;
}) {
  const rsvpUrl = `${APP_URL}/${slug}/rsvp?token=${token}`;

  const html = await render(
    ReminderEmail({ guestName, coupleNames, rsvpDeadline, rsvpUrl })
  );

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Reminder: RSVP for ${coupleNames}`,
    html,
  });
}
