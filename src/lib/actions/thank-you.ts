"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const REVALIDATE_PATH = "/dashboard/thank-you";

async function getWeddingForUser(userId: string) {
  const wedding = await db.wedding.findFirst({ where: { ownerId: userId } });
  if (!wedding) throw new Error("Wedding not found.");
  return wedding;
}

async function assertGiftOwnership(giftId: string, weddingId: string) {
  const gift = await db.gift.findUnique({ where: { id: giftId } });
  if (!gift || gift.weddingId !== weddingId) throw new Error("Gift not found.");
  return gift;
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const giftSchema = z.object({
  guestId:     z.string().optional().nullable(),
  giverName:   z.string().min(1, "Giver name is required").max(150),
  description: z.string().min(1, "Gift description is required").max(300),
  category:    z.enum(["cash", "registry", "experience", "other"]).optional().nullable(),
  value:       z.number().positive().optional().nullable(),
  receivedAt:  z.string().optional().nullable(),
  notes:       z.string().max(500).optional().nullable(),
});

const thankYouSchema = z.object({
  status:        z.enum(["pending", "drafted", "sent"]),
  thankYouNote:  z.string().max(2000).optional().nullable(),
  thankYouSentAt: z.string().optional().nullable(),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type GiftInput = {
  guestId?:     string | null;
  giverName:    string;
  description:  string;
  category?:    "cash" | "registry" | "experience" | "other" | null;
  value?:       number | null;
  receivedAt?:  string | null;
  notes?:       string | null;
};

export type ThankYouInput = {
  status:         "pending" | "drafted" | "sent";
  thankYouNote?:  string | null;
  thankYouSentAt?: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDate(val?: string | null): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function addGiftAction(input: GiftInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = giftSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const wedding = await getWeddingForUser(session.user.id);

  await db.gift.create({
    data: {
      weddingId:   wedding.id,
      guestId:     parsed.data.guestId ?? null,
      giverName:   parsed.data.giverName,
      description: parsed.data.description,
      category:    parsed.data.category ?? null,
      value:       parsed.data.value ?? null,
      receivedAt:  parseDate(parsed.data.receivedAt),
      notes:       parsed.data.notes ?? null,
    },
  });

  revalidatePath(REVALIDATE_PATH);
}

export async function updateGiftAction(id: string, input: GiftInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = giftSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const wedding = await getWeddingForUser(session.user.id);
  await assertGiftOwnership(id, wedding.id);

  await db.gift.update({
    where: { id },
    data: {
      guestId:     parsed.data.guestId ?? null,
      giverName:   parsed.data.giverName,
      description: parsed.data.description,
      category:    parsed.data.category ?? null,
      value:       parsed.data.value ?? null,
      receivedAt:  parseDate(parsed.data.receivedAt),
      notes:       parsed.data.notes ?? null,
    },
  });

  revalidatePath(REVALIDATE_PATH);
}

export async function deleteGiftAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);
  await assertGiftOwnership(id, wedding.id);

  await db.gift.delete({ where: { id } });

  revalidatePath(REVALIDATE_PATH);
}

export async function updateThankYouAction(id: string, input: ThankYouInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = thankYouSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const wedding = await getWeddingForUser(session.user.id);
  await assertGiftOwnership(id, wedding.id);

  await db.gift.update({
    where: { id },
    data: {
      thankYouStatus: parsed.data.status,
      thankYouNote:   parsed.data.thankYouNote ?? null,
      thankYouSentAt: parsed.data.status === "sent"
        ? (parseDate(parsed.data.thankYouSentAt) ?? new Date())
        : null,
    },
  });

  revalidatePath(REVALIDATE_PATH);
}
