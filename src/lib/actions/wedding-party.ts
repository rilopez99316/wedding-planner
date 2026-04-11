"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { WeddingPartyRole, WeddingPartySide } from "@prisma/client";

const REVALIDATE_PATH = "/dashboard/wedding-party";

async function getWeddingForUser(userId: string) {
  const wedding = await db.wedding.findFirst({ where: { ownerId: userId } });
  if (!wedding) throw new Error("Wedding not found.");
  return wedding;
}

// ── Schemas ────────────────────────────────────────────────────────────────

const memberSchema = z.object({
  name:     z.string().min(1, "Name is required").max(120),
  role:     z.nativeEnum(WeddingPartyRole),
  side:     z.nativeEnum(WeddingPartySide),
  photoUrl: z.string().url().optional().nullable(),
  email:    z.string().email("Invalid email").max(200).optional().nullable().or(z.literal("")),
  phone:    z.string().max(40).optional().nullable(),
  notes:    z.string().max(2000).optional().nullable(),
  isPublic: z.boolean().default(true),
});

const reorderSchema = z.array(
  z.object({
    id:           z.string(),
    displayOrder: z.number().int().min(0),
  })
);

// ── Actions ────────────────────────────────────────────────────────────────

export async function addWeddingPartyMemberAction(formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const parsed = memberSchema.safeParse(formData);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const agg = await db.weddingPartyMember.aggregate({
    _max: { displayOrder: true },
    where: { weddingId: wedding.id },
  });
  const nextOrder = (agg._max.displayOrder ?? -1) + 1;

  const member = await db.weddingPartyMember.create({
    data: {
      ...parsed.data,
      weddingId:    wedding.id,
      displayOrder: nextOrder,
    },
  });

  revalidatePath(REVALIDATE_PATH);
  return member;
}

export async function updateWeddingPartyMemberAction(id: string, formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const existing = await db.weddingPartyMember.findFirst({
    where: { id, weddingId: wedding.id },
  });
  if (!existing) throw new Error("Member not found.");

  const parsed = memberSchema.safeParse(formData);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const member = await db.weddingPartyMember.update({
    where: { id },
    data:  parsed.data,
  });

  revalidatePath(REVALIDATE_PATH);
  return member;
}

export async function deleteWeddingPartyMemberAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const existing = await db.weddingPartyMember.findFirst({
    where: { id, weddingId: wedding.id },
  });
  if (!existing) throw new Error("Member not found.");

  await db.weddingPartyMember.delete({ where: { id } });

  revalidatePath(REVALIDATE_PATH);
}

export async function reorderWeddingPartyAction(
  updates: { id: string; displayOrder: number }[]
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = reorderSchema.safeParse(updates);
  if (!parsed.success) throw new Error("Invalid reorder data.");

  const wedding = await getWeddingForUser(session.user.id);

  await db.$transaction(
    parsed.data.map(({ id, displayOrder }) =>
      db.weddingPartyMember.updateMany({
        where: { id, weddingId: wedding.id },
        data:  { displayOrder },
      })
    )
  );
  // No revalidatePath — client updates optimistically
}

export async function toggleMemberPublicAction(id: string, isPublic: boolean) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const existing = await db.weddingPartyMember.findFirst({
    where: { id, weddingId: wedding.id },
  });
  if (!existing) throw new Error("Member not found.");

  await db.weddingPartyMember.update({
    where: { id },
    data:  { isPublic },
  });

  revalidatePath(REVALIDATE_PATH);
}
