"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const REVALIDATE_PATH = "/dashboard/budget";

function revalidateBudget() {
  revalidatePath(REVALIDATE_PATH);
  revalidatePath("/dashboard");
}

async function getWeddingForUser(userId: string) {
  const wedding = await db.wedding.findFirst({ where: { ownerId: userId } });
  if (!wedding) throw new Error("Wedding not found.");
  return wedding;
}

// ── Schemas ────────────────────────────────────────────────────────────────

const totalBudgetSchema = z.object({
  amount: z.number().min(0, "Budget must be a positive number"),
});

const budgetCategorySchema = z.object({
  name:  z.string().min(1, "Category name is required").max(60),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color").default("#6B7280"),
});

const budgetItemSchema = z.object({
  categoryId:    z.string().min(1, "Category is required"),
  name:          z.string().min(1, "Item name is required").max(120),
  estimatedCost: z.number().min(0).default(0),
  actualCost:    z.number().min(0).optional().nullable(),
  amountPaid:    z.number().min(0).default(0),
  vendorName:    z.string().max(120).optional().nullable(),
  dueDate:       z.string().optional().nullable(),
  notes:         z.string().max(500).optional().nullable(),
  paymentStatus: z.enum(["PENDING", "DEPOSIT_PAID", "PAID"]).default("PENDING"),
});

// ── Total budget ────────────────────────────────────────────────────────────

export async function updateTotalBudgetAction(amount: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = totalBudgetSchema.safeParse({ amount });
  if (!parsed.success) throw new Error("Invalid amount.");

  const wedding = await getWeddingForUser(session.user.id);

  await db.wedding.update({
    where: { id: wedding.id },
    data: { totalBudget: parsed.data.amount },
  });

  revalidateBudget();
}

// ── Default categories (seeded on first visit) ─────────────────────────────

const DEFAULT_CATEGORIES = [
  { name: "Venue & Catering",      color: "#6366f1", order: 0 },
  { name: "Photography & Video",   color: "#f59e0b", order: 1 },
  { name: "Florals & Decor",       color: "#10b981", order: 2 },
  { name: "Music & Entertainment", color: "#3b82f6", order: 3 },
  { name: "Attire & Beauty",       color: "#ec4899", order: 4 },
  { name: "Stationery & Paper",    color: "#8b5cf6", order: 5 },
  { name: "Transportation",        color: "#14b8a6", order: 6 },
  { name: "Cake & Desserts",       color: "#f97316", order: 7 },
  { name: "Honeymoon",             color: "#06b6d4", order: 8 },
  { name: "Miscellaneous",         color: "#6b7280", order: 9 },
];

export async function initBudgetCategoriesAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const count = await db.budgetCategory.count({ where: { weddingId: wedding.id } });
  if (count > 0) return;

  await db.budgetCategory.createMany({
    data: DEFAULT_CATEGORIES.map((d) => ({ ...d, weddingId: wedding.id })),
  });

  revalidateBudget();
}

// ── Categories ──────────────────────────────────────────────────────────────

export async function addBudgetCategoryAction(formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = budgetCategorySchema.safeParse(formData);
  if (!parsed.success) throw new Error("Invalid input. Please check your data and try again.");

  const wedding = await getWeddingForUser(session.user.id);

  const last = await db.budgetCategory.findFirst({
    where: { weddingId: wedding.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await db.budgetCategory.create({
    data: {
      weddingId: wedding.id,
      name:      parsed.data.name,
      color:     parsed.data.color,
      order:     (last?.order ?? -1) + 1,
    },
  });

  revalidateBudget();
}

export async function updateBudgetCategoryAction(id: string, formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = budgetCategorySchema.safeParse(formData);
  if (!parsed.success) throw new Error("Invalid data.");

  const wedding = await getWeddingForUser(session.user.id);

  const existing = await db.budgetCategory.findFirst({
    where: { id, weddingId: wedding.id },
  });
  if (!existing) throw new Error("Category not found.");

  await db.budgetCategory.update({
    where: { id },
    data: { name: parsed.data.name, color: parsed.data.color },
  });

  revalidateBudget();
}

export async function deleteBudgetCategoryAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const existing = await db.budgetCategory.findFirst({
    where: { id, weddingId: wedding.id },
    include: { _count: { select: { items: true } } },
  });
  if (!existing) throw new Error("Category not found.");
  if (existing._count.items > 0) throw new Error("Remove all items before deleting this category.");

  await db.budgetCategory.delete({ where: { id } });
  revalidateBudget();
}

// ── Budget items ────────────────────────────────────────────────────────────

export async function addBudgetItemAction(formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = budgetItemSchema.safeParse(formData);
  if (!parsed.success) throw new Error("Invalid input. Please check your data and try again.");

  const wedding = await getWeddingForUser(session.user.id);
  const data = parsed.data;

  const category = await db.budgetCategory.findFirst({
    where: { id: data.categoryId, weddingId: wedding.id },
  });
  if (!category) throw new Error("Category not found.");

  await db.budgetItem.create({
    data: {
      weddingId:     wedding.id,
      categoryId:    data.categoryId,
      name:          data.name,
      estimatedCost: data.estimatedCost,
      actualCost:    data.actualCost ?? null,
      amountPaid:    data.amountPaid,
      vendorName:    data.vendorName ?? null,
      dueDate:       data.dueDate ? new Date(data.dueDate) : null,
      notes:         data.notes ?? null,
      paymentStatus: data.paymentStatus,
    },
  });

  revalidateBudget();
}

export async function updateBudgetItemAction(id: string, formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = budgetItemSchema.safeParse(formData);
  if (!parsed.success) throw new Error("Invalid data.");

  const wedding = await getWeddingForUser(session.user.id);
  const data = parsed.data;

  const existing = await db.budgetItem.findFirst({
    where: { id, weddingId: wedding.id },
  });
  if (!existing) throw new Error("Item not found.");

  const category = await db.budgetCategory.findFirst({
    where: { id: data.categoryId, weddingId: wedding.id },
  });
  if (!category) throw new Error("Category not found.");

  await db.budgetItem.update({
    where: { id },
    data: {
      categoryId:    data.categoryId,
      name:          data.name,
      estimatedCost: data.estimatedCost,
      actualCost:    data.actualCost ?? null,
      amountPaid:    data.amountPaid,
      vendorName:    data.vendorName ?? null,
      dueDate:       data.dueDate ? new Date(data.dueDate) : null,
      notes:         data.notes ?? null,
      paymentStatus: data.paymentStatus,
    },
  });

  revalidateBudget();
}

export async function deleteBudgetItemAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const existing = await db.budgetItem.findFirst({
    where: { id, weddingId: wedding.id },
  });
  if (!existing) throw new Error("Item not found.");

  await db.budgetItem.delete({ where: { id } });
  revalidateBudget();
}
