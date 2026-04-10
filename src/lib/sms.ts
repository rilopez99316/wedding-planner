import twilio from "twilio";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token || sid.startsWith("AC") === false || sid === "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx") {
    return null;
  }
  return twilio(sid, token);
}

function getFrom() {
  return process.env.TWILIO_PHONE_NUMBER ?? "";
}

export async function sendInvitationSms({
  to,
  guestName,
  coupleNames,
  slug,
  token,
}: {
  to: string;
  guestName: string;
  coupleNames: string;
  slug: string;
  token: string;
}) {
  const client = getClient();
  if (!client) return;

  const rsvpUrl = `${APP_URL}/${slug}/rsvp?token=${token}`;
  const body = `Hi ${guestName}! You're invited to celebrate ${coupleNames}. Please RSVP here: ${rsvpUrl}`;

  return client.messages.create({ body, from: getFrom(), to });
}

export async function sendReminderSms({
  to,
  guestName,
  coupleNames,
  slug,
  token,
  rsvpDeadline,
}: {
  to: string;
  guestName: string;
  coupleNames: string;
  slug: string;
  token: string;
  rsvpDeadline: Date;
}) {
  const client = getClient();
  if (!client) return;

  const rsvpUrl = `${APP_URL}/${slug}/rsvp?token=${token}`;
  const deadline = rsvpDeadline.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const body = `Hi ${guestName}, reminder to RSVP for ${coupleNames} by ${deadline}: ${rsvpUrl}`;

  return client.messages.create({ body, from: getFrom(), to });
}

export async function sendConfirmationSms({
  to,
  guestName,
  coupleNames,
  attending,
}: {
  to: string;
  guestName: string;
  coupleNames: string;
  attending: boolean;
}) {
  const client = getClient();
  if (!client) return;

  const body = attending
    ? `Hi ${guestName}, your RSVP is confirmed — we'll see you at ${coupleNames}'s wedding!`
    : `Hi ${guestName}, we've received your RSVP. You'll be missed at ${coupleNames}'s wedding.`;

  return client.messages.create({ body, from: getFrom(), to });
}
