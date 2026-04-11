"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  DEFAULT_TIMELINE_EVENTS,
  buildEventDateTime,
} from "@/lib/timeline-constants";

const REVALIDATE_PATH = "/dashboard/timeline";

async function getWeddingForUser(userId: string) {
  const wedding = await db.wedding.findFirst({ where: { ownerId: userId } });
  if (!wedding) throw new Error("Wedding not found.");
  return wedding;
}

// ── Schema ─────────────────────────────────────────────────────────────────

const timelineEventSchema = z.object({
  title:      z.string().min(1, "Title is required").max(200),
  startTime:  z.string().min(1, "Start time is required"),
  endTime:    z.string().nullable().optional(),
  category:   z.enum([
    "getting_ready",
    "travel",
    "ceremony",
    "photos",
    "cocktail_hour",
    "reception",
    "other",
  ]),
  location:   z.string().max(200).nullable().optional(),
  assignedTo: z.string().max(200).nullable().optional(),
  notes:      z.string().max(2000).nullable().optional(),
});

// ── Actions ────────────────────────────────────────────────────────────────

export async function addTimelineEventAction(formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = timelineEventSchema.safeParse(formData);
  if (!parsed.success) throw new Error("Invalid data: " + JSON.stringify(parsed.error.flatten()));

  const wedding = await getWeddingForUser(session.user.id);

  const maxOrder = await db.timelineEvent.aggregate({
    where: { weddingId: wedding.id },
    _max:  { order: true },
  });

  const order = (maxOrder._max.order ?? -1) + 1;

  const event = await db.timelineEvent.create({
    data: {
      weddingId:  wedding.id,
      title:      parsed.data.title,
      startTime:  new Date(parsed.data.startTime),
      endTime:    parsed.data.endTime ? new Date(parsed.data.endTime) : null,
      category:   parsed.data.category,
      location:   parsed.data.location   ?? null,
      assignedTo: parsed.data.assignedTo ?? null,
      notes:      parsed.data.notes      ?? null,
      order,
    },
  });

  revalidatePath(REVALIDATE_PATH);
  return event;
}

export async function updateTimelineEventAction(id: string, formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = timelineEventSchema.safeParse(formData);
  if (!parsed.success) throw new Error("Invalid data: " + JSON.stringify(parsed.error.flatten()));

  const wedding = await getWeddingForUser(session.user.id);

  const existing = await db.timelineEvent.findFirst({
    where: { id, weddingId: wedding.id },
  });
  if (!existing) throw new Error("Event not found.");

  const event = await db.timelineEvent.update({
    where: { id },
    data: {
      title:      parsed.data.title,
      startTime:  new Date(parsed.data.startTime),
      endTime:    parsed.data.endTime ? new Date(parsed.data.endTime) : null,
      category:   parsed.data.category,
      location:   parsed.data.location   ?? null,
      assignedTo: parsed.data.assignedTo ?? null,
      notes:      parsed.data.notes      ?? null,
    },
  });

  revalidatePath(REVALIDATE_PATH);
  return event;
}

export async function deleteTimelineEventAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const existing = await db.timelineEvent.findFirst({
    where: { id, weddingId: wedding.id },
  });
  if (!existing) throw new Error("Event not found.");

  await db.timelineEvent.delete({ where: { id } });

  revalidatePath(REVALIDATE_PATH);
}

export async function seedTemplateAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const count = await db.timelineEvent.count({
    where: { weddingId: wedding.id },
  });
  if (count > 0) throw new Error("Timeline already has events. Delete all events first to reload the template.");

  const data = DEFAULT_TIMELINE_EVENTS.map((evt) => {
    const startTime = buildEventDateTime(wedding.weddingDate, evt.offsetHours);
    const endOffsetHours = evt.offsetHours + evt.durationMinutes / 60;
    const endTime = buildEventDateTime(wedding.weddingDate, endOffsetHours);

    return {
      weddingId:  wedding.id,
      title:      evt.title,
      startTime,
      endTime,
      category:   evt.category,
      location:   evt.location   ?? null,
      assignedTo: evt.assignedTo ?? null,
      notes:      evt.notes      ?? null,
      order:      evt.order,
    };
  });

  await db.timelineEvent.createMany({ data });

  revalidatePath(REVALIDATE_PATH);
}
