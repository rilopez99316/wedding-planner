"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function getWeddingForUser(userId: string) {
  const wedding = await db.wedding.findFirst({ where: { ownerId: userId } });
  if (!wedding) throw new Error("Wedding not found.");
  return wedding;
}

// ── Wedding details ────────────────────────────────────────────────────────

const weddingDetailsSchema = z.object({
  partner1Name:  z.string().min(1),
  partner2Name:  z.string().min(1),
  weddingDate:   z.string().min(1),
  rsvpDeadline:  z.string().min(1),
  venueName:     z.string().optional(),
  venueAddress:  z.string().optional(),
  accentColor:   z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export async function updateWeddingDetailsAction(formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = weddingDetailsSchema.safeParse(formData);
  if (!parsed.success) throw new Error("Invalid data.");

  const wedding = await getWeddingForUser(session.user.id);
  const data = parsed.data;

  await db.wedding.update({
    where: { id: wedding.id },
    data: {
      partner1Name: data.partner1Name,
      partner2Name: data.partner2Name,
      weddingDate:  new Date(data.weddingDate),
      rsvpDeadline: new Date(data.rsvpDeadline),
      venueName:    data.venueName || null,
      venueAddress: data.venueAddress || null,
      accentColor:  data.accentColor ?? wedding.accentColor,
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath(`/${wedding.slug}`);
}

// ── Events ────────────────────────────────────────────────────────────────

const eventSchema = z.object({
  key:      z.string().min(1).regex(/^[a-z0-9-]+$/),
  label:    z.string().min(1),
  date:     z.string().min(1),
  location: z.string().optional(),
  notes:    z.string().optional(),
  order:    z.number().int().default(0),
});

export async function addEventAction(formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = eventSchema.safeParse(formData);
  if (!parsed.success) throw new Error("Invalid data.");

  const wedding = await getWeddingForUser(session.user.id);
  const data = parsed.data;

  // Check key uniqueness within this wedding
  const existing = await db.weddingEvent.findUnique({
    where: { weddingId_key: { weddingId: wedding.id, key: data.key } },
  });
  if (existing) throw new Error("An event with that key already exists.");

  await db.weddingEvent.create({
    data: {
      weddingId: wedding.id,
      key:       data.key,
      label:     data.label,
      date:      new Date(data.date),
      location:  data.location || null,
      notes:     data.notes || null,
      order:     data.order,
    },
  });

  revalidatePath("/dashboard/settings/events");
  revalidatePath(`/${wedding.slug}/schedule`);
}

export async function updateEventAction(eventId: string, formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = eventSchema.safeParse(formData);
  if (!parsed.success) throw new Error("Invalid data.");

  const wedding = await getWeddingForUser(session.user.id);

  // Verify ownership
  const event = await db.weddingEvent.findFirst({
    where: { id: eventId, weddingId: wedding.id },
  });
  if (!event) throw new Error("Event not found.");

  const data = parsed.data;

  await db.weddingEvent.update({
    where: { id: eventId },
    data: {
      key:      data.key,
      label:    data.label,
      date:     new Date(data.date),
      location: data.location || null,
      notes:    data.notes || null,
      order:    data.order,
    },
  });

  revalidatePath("/dashboard/settings/events");
  revalidatePath(`/${wedding.slug}/schedule`);
}

export async function deleteEventAction(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const event = await db.weddingEvent.findFirst({
    where: { id: eventId, weddingId: wedding.id },
  });
  if (!event) throw new Error("Event not found.");

  await db.weddingEvent.delete({ where: { id: eventId } });

  revalidatePath("/dashboard/settings/events");
  revalidatePath(`/${wedding.slug}/schedule`);
}
