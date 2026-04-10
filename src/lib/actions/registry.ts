"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const REVALIDATE_PATH = "/dashboard/registry";

async function getWeddingForUser(userId: string) {
  const wedding = await db.wedding.findFirst({ where: { ownerId: userId } });
  if (!wedding) throw new Error("Wedding not found.");
  return wedding;
}

const registrySchema = z.object({
  type:        z.enum(["REGISTRY", "FUND"]).default("REGISTRY"),
  store:       z.string().min(1, "Store name is required").max(80),
  url:         z.string().url("Enter a valid URL (include https://)"),
  description: z.string().max(200).optional().nullable(),
  isPublic:    z.boolean().default(true),
});

export async function addRegistryAction(input: {
  type: "REGISTRY" | "FUND";
  store: string;
  url: string;
  description?: string;
  isPublic: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = registrySchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const wedding = await getWeddingForUser(session.user.id);

  await db.registry.create({
    data: {
      weddingId:   wedding.id,
      type:        parsed.data.type,
      store:       parsed.data.store,
      url:         parsed.data.url,
      description: parsed.data.description ?? null,
      isPublic:    parsed.data.isPublic,
    },
  });

  revalidatePath(REVALIDATE_PATH);
}

export async function updateRegistryAction(
  id: string,
  input: {
    type: "REGISTRY" | "FUND";
    store: string;
    url: string;
    description?: string;
    isPublic: boolean;
  }
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = registrySchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const wedding = await getWeddingForUser(session.user.id);

  const existing = await db.registry.findUnique({ where: { id } });
  if (!existing || existing.weddingId !== wedding.id) throw new Error("Registry not found.");

  await db.registry.update({
    where: { id },
    data: {
      type:        parsed.data.type,
      store:       parsed.data.store,
      url:         parsed.data.url,
      description: parsed.data.description ?? null,
      isPublic:    parsed.data.isPublic,
    },
  });

  revalidatePath(REVALIDATE_PATH);
}

export async function deleteRegistryAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const existing = await db.registry.findUnique({ where: { id } });
  if (!existing || existing.weddingId !== wedding.id) throw new Error("Registry not found.");

  await db.registry.delete({ where: { id } });

  revalidatePath(REVALIDATE_PATH);
}
