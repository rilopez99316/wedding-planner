"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const REVALIDATE_PATH = "/dashboard/accommodations";

async function getWeddingForUser(userId: string) {
  const wedding = await db.wedding.findFirst({ where: { ownerId: userId } });
  if (!wedding) throw new Error("Wedding not found.");
  return wedding;
}

const accommodationSchema = z.object({
  name:          z.string().min(1, "Hotel name is required").max(100),
  address:       z.string().max(200).optional().nullable(),
  bookingUrl:    z.string().url("Enter a valid URL (include https://)").optional().nullable().or(z.literal("")),
  promoCode:     z.string().max(50).optional().nullable(),
  roomsTotal:    z.number().int().positive().optional().nullable(),
  roomsBooked:   z.number().int().min(0).default(0),
  pricePerNight: z.number().positive().optional().nullable(),
  checkInDate:   z.string().optional().nullable(),
  checkOutDate:  z.string().optional().nullable(),
  deadline:      z.string().optional().nullable(),
  notes:         z.string().max(500).optional().nullable(),
});

type AccommodationInput = {
  name: string;
  address?: string | null;
  bookingUrl?: string | null;
  promoCode?: string | null;
  roomsTotal?: number | null;
  roomsBooked?: number;
  pricePerNight?: number | null;
  checkInDate?: string | null;
  checkOutDate?: string | null;
  deadline?: string | null;
  notes?: string | null;
};

function parseDate(val?: string | null): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export async function addAccommodationAction(input: AccommodationInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = accommodationSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const wedding = await getWeddingForUser(session.user.id);

  await db.hotelBlock.create({
    data: {
      weddingId:     wedding.id,
      name:          parsed.data.name,
      address:       parsed.data.address ?? null,
      bookingUrl:    parsed.data.bookingUrl || null,
      promoCode:     parsed.data.promoCode ?? null,
      roomsTotal:    parsed.data.roomsTotal ?? null,
      roomsBooked:   parsed.data.roomsBooked ?? 0,
      pricePerNight: parsed.data.pricePerNight ?? null,
      checkInDate:   parseDate(parsed.data.checkInDate),
      checkOutDate:  parseDate(parsed.data.checkOutDate),
      deadline:      parseDate(parsed.data.deadline),
      notes:         parsed.data.notes ?? null,
    },
  });

  revalidatePath(REVALIDATE_PATH);
}

export async function updateAccommodationAction(id: string, input: AccommodationInput) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = accommodationSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const wedding = await getWeddingForUser(session.user.id);

  const existing = await db.hotelBlock.findUnique({ where: { id } });
  if (!existing || existing.weddingId !== wedding.id) throw new Error("Hotel block not found.");

  await db.hotelBlock.update({
    where: { id },
    data: {
      name:          parsed.data.name,
      address:       parsed.data.address ?? null,
      bookingUrl:    parsed.data.bookingUrl || null,
      promoCode:     parsed.data.promoCode ?? null,
      roomsTotal:    parsed.data.roomsTotal ?? null,
      roomsBooked:   parsed.data.roomsBooked ?? 0,
      pricePerNight: parsed.data.pricePerNight ?? null,
      checkInDate:   parseDate(parsed.data.checkInDate),
      checkOutDate:  parseDate(parsed.data.checkOutDate),
      deadline:      parseDate(parsed.data.deadline),
      notes:         parsed.data.notes ?? null,
    },
  });

  revalidatePath(REVALIDATE_PATH);
}

export async function deleteAccommodationAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const existing = await db.hotelBlock.findUnique({ where: { id } });
  if (!existing || existing.weddingId !== wedding.id) throw new Error("Hotel block not found.");

  await db.hotelBlock.delete({ where: { id } });

  revalidatePath(REVALIDATE_PATH);
}
