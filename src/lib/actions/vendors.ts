"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const REVALIDATE_PATH = "/dashboard/vendors";

async function getWeddingForUser(userId: string) {
  const wedding = await db.wedding.findFirst({ where: { ownerId: userId } });
  if (!wedding) throw new Error("Wedding not found.");
  return wedding;
}

// ── Schemas ────────────────────────────────────────────────────────────────

const vendorSchema = z.object({
  category:    z.enum(["venue", "photographer", "caterer", "florist", "dj", "other"]),
  name:        z.string().min(1, "Vendor name is required").max(120),
  contactName: z.string().max(120).optional().nullable(),
  email:       z.string().email("Invalid email").max(200).optional().nullable().or(z.literal("")),
  phone:       z.string().max(40).optional().nullable(),
  website:     z.string().max(300).optional().nullable(),
  notes:       z.string().max(1000).optional().nullable(),
});

const packageSchema = z.object({
  name:       z.string().min(1, "Package name is required").max(120),
  price:      z.number().min(0).optional().nullable(),
  capacity:   z.number().int().min(0).optional().nullable(),
  inclusions: z.string().max(1000).optional().nullable(),
  notes:      z.string().max(500).optional().nullable(),
});

const statusSchema = z.enum(["prospect", "shortlisted", "booked", "rejected"]);

// ── Vendors ────────────────────────────────────────────────────────────────

export async function getVendorsAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  return db.vendor.findMany({
    where:   { weddingId: wedding.id },
    include: {
      packages:  { orderBy: { createdAt: "asc" } },
      documents: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function addVendorAction(formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = vendorSchema.safeParse(formData);
  if (!parsed.success) throw new Error("Invalid input. Please check your data and try again.");

  const wedding = await getWeddingForUser(session.user.id);
  const data = parsed.data;

  const vendor = await db.vendor.create({
    data: {
      weddingId:   wedding.id,
      category:    data.category,
      name:        data.name,
      contactName: data.contactName ?? null,
      email:       data.email || null,
      phone:       data.phone ?? null,
      website:     data.website ?? null,
      notes:       data.notes ?? null,
    },
  });

  revalidatePath(REVALIDATE_PATH);
  return vendor;
}

export async function updateVendorAction(id: string, formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = vendorSchema.safeParse(formData);
  if (!parsed.success) throw new Error("Invalid data.");

  const wedding = await getWeddingForUser(session.user.id);
  const data = parsed.data;

  const existing = await db.vendor.findFirst({ where: { id, weddingId: wedding.id } });
  if (!existing) throw new Error("Vendor not found.");

  const vendor = await db.vendor.update({
    where: { id },
    data: {
      category:    data.category,
      name:        data.name,
      contactName: data.contactName ?? null,
      email:       data.email || null,
      phone:       data.phone ?? null,
      website:     data.website ?? null,
      notes:       data.notes ?? null,
    },
    include: {
      packages:  { orderBy: { createdAt: "asc" } },
      documents: { orderBy: { createdAt: "asc" } },
    },
  });

  revalidatePath(REVALIDATE_PATH);
  return vendor;
}

export async function deleteVendorAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const existing = await db.vendor.findFirst({ where: { id, weddingId: wedding.id } });
  if (!existing) throw new Error("Vendor not found.");

  await db.vendor.delete({ where: { id } });
  revalidatePath(REVALIDATE_PATH);
}

export async function updateVendorStatusAction(id: string, status: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsedStatus = statusSchema.safeParse(status);
  if (!parsedStatus.success) throw new Error("Invalid status.");

  const wedding = await getWeddingForUser(session.user.id);

  const existing = await db.vendor.findFirst({ where: { id, weddingId: wedding.id } });
  if (!existing) throw new Error("Vendor not found.");

  await db.vendor.update({ where: { id }, data: { status: parsedStatus.data } });
  revalidatePath(REVALIDATE_PATH);
}

// ── Packages ───────────────────────────────────────────────────────────────

export async function addPackageAction(vendorId: string, formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = packageSchema.safeParse(formData);
  if (!parsed.success) throw new Error("Invalid input. Please check your data and try again.");

  const wedding = await getWeddingForUser(session.user.id);
  const vendor = await db.vendor.findFirst({ where: { id: vendorId, weddingId: wedding.id } });
  if (!vendor) throw new Error("Vendor not found.");

  const data = parsed.data;
  const pkg = await db.vendorPackage.create({
    data: {
      vendorId,
      name:       data.name,
      price:      data.price ?? null,
      capacity:   data.capacity ?? null,
      inclusions: data.inclusions ?? null,
      notes:      data.notes ?? null,
    },
  });

  revalidatePath(REVALIDATE_PATH);
  return pkg;
}

export async function updatePackageAction(id: string, formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = packageSchema.safeParse(formData);
  if (!parsed.success) throw new Error("Invalid data.");

  const wedding = await getWeddingForUser(session.user.id);

  const existing = await db.vendorPackage.findFirst({
    where:   { id },
    include: { vendor: true },
  });
  if (!existing || existing.vendor.weddingId !== wedding.id) throw new Error("Package not found.");

  const data = parsed.data;
  await db.vendorPackage.update({
    where: { id },
    data: {
      name:       data.name,
      price:      data.price ?? null,
      capacity:   data.capacity ?? null,
      inclusions: data.inclusions ?? null,
      notes:      data.notes ?? null,
    },
  });

  revalidatePath(REVALIDATE_PATH);
}

export async function deletePackageAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const existing = await db.vendorPackage.findFirst({
    where:   { id },
    include: { vendor: true },
  });
  if (!existing || existing.vendor.weddingId !== wedding.id) throw new Error("Package not found.");

  await db.vendorPackage.delete({ where: { id } });
  revalidatePath(REVALIDATE_PATH);
}

// ── Vendor Documents ───────────────────────────────────────────────────────

export async function addVendorDocumentAction(
  vendorId: string,
  name: string,
  url: string,
  fileType: string,
  fileSize?: number
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const vendor = await db.vendor.findFirst({ where: { id: vendorId, weddingId: wedding.id } });
  if (!vendor) throw new Error("Vendor not found.");

  const doc = await db.vendorDocument.create({
    data: {
      vendorId,
      name,
      url,
      fileType,
      fileSize: fileSize ?? null,
    },
  });

  revalidatePath(REVALIDATE_PATH);
  return doc;
}

export async function deleteVendorDocumentAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const existing = await db.vendorDocument.findFirst({
    where:   { id },
    include: { vendor: true },
  });
  if (!existing || existing.vendor.weddingId !== wedding.id) throw new Error("Document not found.");

  await db.vendorDocument.delete({ where: { id } });
  revalidatePath(REVALIDATE_PATH);
}
