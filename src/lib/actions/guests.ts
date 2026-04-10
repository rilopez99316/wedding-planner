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

const guestGroupSchema = z.object({
  groupName:          z.string().min(1),
  hasPlusOne:         z.boolean().optional().default(false),
  plusOneNameIfKnown: z.string().optional(),
  invitationTier:     z.enum(["A", "B"]).default("A"),
  guests: z.array(z.object({
    firstName: z.string().min(1),
    lastName:  z.string().min(1),
    email:     z.string().email().optional().or(z.literal("")),
    phone:     z.string().optional(),
    address:   z.string().optional(),
  })).min(1),
  eventIds: z.array(z.string()).optional().default([]),
});

export async function addGuestGroupAction(formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = guestGroupSchema.safeParse(formData);
  if (!parsed.success) throw new Error("Invalid data: " + JSON.stringify(parsed.error.flatten()));

  const wedding = await getWeddingForUser(session.user.id);
  const data = parsed.data;

  const group = await db.guestGroup.create({
    data: {
      weddingId:          wedding.id,
      groupName:          data.groupName,
      hasPlusOne:         data.hasPlusOne,
      plusOneNameIfKnown: data.plusOneNameIfKnown || null,
      invitationTier:     data.invitationTier,
      guests: {
        create: data.guests.map((g, i) => ({
          weddingId: wedding.id,
          firstName: g.firstName,
          lastName:  g.lastName,
          email:     g.email || null,
          phone:     g.phone || null,
          address:   g.address || null,
          isPlusOne: false,
        })),
      },
      allowedEvents: data.eventIds.length > 0 ? {
        create: data.eventIds.map((eventId) => ({ eventId })),
      } : undefined,
    },
    include: { guests: true },
  });

  revalidatePath("/dashboard/guests");
  return group;
}

export async function updateGuestGroupAction(groupId: string, formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  // Verify ownership
  const existing = await db.guestGroup.findFirst({
    where: { id: groupId, weddingId: wedding.id },
  });
  if (!existing) throw new Error("Guest group not found.");

  const parsed = guestGroupSchema.safeParse(formData);
  if (!parsed.success) throw new Error("Invalid data.");

  const data = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.$transaction(async (tx: any) => {
    // Update group
    await tx.guestGroup.update({
      where: { id: groupId },
      data: {
        groupName:          data.groupName,
        hasPlusOne:         data.hasPlusOne,
        plusOneNameIfKnown: data.plusOneNameIfKnown || null,
        invitationTier:     data.invitationTier,
      },
    });

    // Replace event assignments
    await tx.guestGroupEvent.deleteMany({ where: { groupId } });
    if (data.eventIds.length > 0) {
      await tx.guestGroupEvent.createMany({
        data: data.eventIds.map((eventId) => ({ groupId, eventId })),
      });
    }
  });

  revalidatePath("/dashboard/guests");
}

export async function deleteGuestGroupAction(groupId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const existing = await db.guestGroup.findFirst({
    where: { id: groupId, weddingId: wedding.id },
  });
  if (!existing) throw new Error("Guest group not found.");

  await db.guestGroup.delete({ where: { id: groupId } });
  revalidatePath("/dashboard/guests");
}

export async function searchGuestsAction(query: string, weddingId: string) {
  if (!query || query.trim().length < 2) return [];

  const groups = await db.guestGroup.findMany({
    where: {
      weddingId,
      OR: [
        { groupName: { contains: query, mode: "insensitive" } },
        { guests: { some: { firstName: { contains: query, mode: "insensitive" } } } },
        { guests: { some: { lastName:  { contains: query, mode: "insensitive" } } } },
      ],
    },
    include: {
      guests: true,
      allowedEvents: { include: { event: true } },
      rsvpResponse: true,
    },
    take: 6,
  });

  return groups;
}
