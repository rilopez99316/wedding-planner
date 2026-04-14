"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DEFAULT_CEREMONY_ITEMS } from "@/lib/ceremony-constants";

const REVALIDATE_PATH = "/dashboard/ceremony";

async function getWeddingForUser(userId: string) {
  const wedding = await db.wedding.findFirst({ where: { ownerId: userId } });
  if (!wedding) throw new Error("Wedding not found.");
  return wedding;
}

async function getOrCreateProgram(weddingId: string) {
  const existing = await db.ceremonyProgram.findUnique({ where: { weddingId } });
  if (existing) return existing;
  return db.ceremonyProgram.create({ data: { weddingId } });
}

// ── Schemas ────────────────────────────────────────────────────────────────

const ceremonyItemSchema = z.object({
  type:        z.enum([
    "processional",
    "welcome",
    "reading",
    "prayer",
    "music_moment",
    "vows",
    "rings",
    "unity",
    "pronouncement",
    "recessional",
    "custom",
  ]),
  title:       z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).nullable().optional(),
  assignedTo:  z.string().max(200).nullable().optional(),
  notes:       z.string().max(2000).nullable().optional(),
});

const vowsSchema = z.object({
  partner1Vows: z.string().max(10000).nullable().optional(),
  partner2Vows: z.string().max(10000).nullable().optional(),
});

const musicSchema = z.object({
  processionalSong: z.string().max(300).nullable().optional(),
  recessionalSong:  z.string().max(300).nullable().optional(),
});

// ── Actions ────────────────────────────────────────────────────────────────

export async function addCeremonyItemAction(formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = ceremonyItemSchema.safeParse(formData);
  if (!parsed.success) throw new Error("Invalid data: " + JSON.stringify(parsed.error.flatten()));

  const wedding = await getWeddingForUser(session.user.id);
  const program = await getOrCreateProgram(wedding.id);

  const maxOrder = await db.ceremonyItem.aggregate({
    where: { programId: program.id },
    _max:  { order: true },
  });
  const order = (maxOrder._max.order ?? -1) + 1;

  const item = await db.ceremonyItem.create({
    data: {
      programId:   program.id,
      type:        parsed.data.type,
      title:       parsed.data.title,
      description: parsed.data.description ?? null,
      assignedTo:  parsed.data.assignedTo  ?? null,
      notes:       parsed.data.notes       ?? null,
      order,
    },
  });

  revalidatePath(REVALIDATE_PATH);
  return item;
}

export async function updateCeremonyItemAction(id: string, formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = ceremonyItemSchema.safeParse(formData);
  if (!parsed.success) throw new Error("Invalid data: " + JSON.stringify(parsed.error.flatten()));

  const wedding = await getWeddingForUser(session.user.id);
  const program = await db.ceremonyProgram.findUnique({ where: { weddingId: wedding.id } });
  if (!program) throw new Error("Program not found.");

  const existing = await db.ceremonyItem.findFirst({ where: { id, programId: program.id } });
  if (!existing) throw new Error("Item not found.");

  const item = await db.ceremonyItem.update({
    where: { id },
    data: {
      type:        parsed.data.type,
      title:       parsed.data.title,
      description: parsed.data.description ?? null,
      assignedTo:  parsed.data.assignedTo  ?? null,
      notes:       parsed.data.notes       ?? null,
    },
  });

  revalidatePath(REVALIDATE_PATH);
  return item;
}

export async function deleteCeremonyItemAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);
  const program = await db.ceremonyProgram.findUnique({ where: { weddingId: wedding.id } });
  if (!program) throw new Error("Program not found.");

  const existing = await db.ceremonyItem.findFirst({ where: { id, programId: program.id } });
  if (!existing) throw new Error("Item not found.");

  await db.ceremonyItem.delete({ where: { id } });

  revalidatePath(REVALIDATE_PATH);
}

export async function reorderCeremonyItemsAction(orderedIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);
  const program = await db.ceremonyProgram.findUnique({ where: { weddingId: wedding.id } });
  if (!program) throw new Error("Program not found.");

  await db.$transaction(
    orderedIds.map((id, index) =>
      db.ceremonyItem.updateMany({
        where: { id, programId: program.id },
        data:  { order: index },
      })
    )
  );

  revalidatePath(REVALIDATE_PATH);
}

export async function updateVowsAction(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = vowsSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid data.");

  const wedding = await getWeddingForUser(session.user.id);
  const program = await getOrCreateProgram(wedding.id);

  await db.ceremonyProgram.update({
    where: { id: program.id },
    data: {
      ...(parsed.data.partner1Vows !== undefined && { partner1Vows: parsed.data.partner1Vows ?? null }),
      ...(parsed.data.partner2Vows !== undefined && { partner2Vows: parsed.data.partner2Vows ?? null }),
    },
  });

  revalidatePath(REVALIDATE_PATH);
}

export async function updateMusicAction(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = musicSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid data.");

  const wedding = await getWeddingForUser(session.user.id);
  const program = await getOrCreateProgram(wedding.id);

  await db.ceremonyProgram.update({
    where: { id: program.id },
    data: {
      processionalSong: parsed.data.processionalSong ?? null,
      recessionalSong:  parsed.data.recessionalSong  ?? null,
    },
  });

  revalidatePath(REVALIDATE_PATH);
}

export async function seedDefaultCeremonyAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);
  const program = await getOrCreateProgram(wedding.id);

  const count = await db.ceremonyItem.count({ where: { programId: program.id } });
  if (count > 0) throw new Error("Program already has items. Delete all items first to reload the template.");

  await db.ceremonyItem.createMany({
    data: DEFAULT_CEREMONY_ITEMS.map((item) => ({
      programId:   program.id,
      type:        item.type,
      title:       item.title,
      description: item.description || null,
      order:       item.order,
    })),
  });

  const items = await db.ceremonyItem.findMany({
    where:   { programId: program.id },
    orderBy: { order: "asc" },
  });

  revalidatePath(REVALIDATE_PATH);
  return items;
}
