"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

const REVALIDATE_PATH = "/dashboard/checklist";

async function getWeddingForUser(userId: string) {
  const wedding = await db.wedding.findFirst({ where: { ownerId: userId } });
  if (!wedding) throw new Error("Wedding not found.");
  return wedding;
}

// ── Default tasks ────────────────────────────────────────────────────────────

function subtractMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  return d;
}

function subtractWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - weeks * 7);
  return d;
}

type DefaultTask = { category: string; title: string; order: number };

const DEFAULT_TASKS: DefaultTask[] = [
  // 12+ Months Before
  { category: "12_plus", title: "Set your overall wedding budget",                        order: 0 },
  { category: "12_plus", title: "Decide on your wedding date",                            order: 1 },
  { category: "12_plus", title: "Draft your initial guest list",                          order: 2 },
  { category: "12_plus", title: "Discuss your wedding vision and priorities as a couple", order: 3 },
  { category: "12_plus", title: "Tour ceremony and reception venue options",              order: 4 },
  { category: "12_plus", title: "Create your wedding aesthetic and vision board",         order: 5 },
  { category: "12_plus", title: "Book your ceremony venue",                               order: 6 },
  { category: "12_plus", title: "Book your reception venue",                              order: 7 },
  { category: "12_plus", title: "Start researching wedding photographers",                order: 8 },
  { category: "12_plus", title: "Hire your wedding planner or day-of coordinator",       order: 9 },

  // 9–12 Months Before
  { category: "9_12", title: "Book your wedding photographer",                            order: 0 },
  { category: "9_12", title: "Book your videographer",                                    order: 1 },
  { category: "9_12", title: "Research and book your caterer (if not included with venue)", order: 2 },
  { category: "9_12", title: "Start researching florists",                                order: 3 },
  { category: "9_12", title: "Book your band or DJ",                                      order: 4 },
  { category: "9_12", title: "Book your officiant",                                       order: 5 },
  { category: "9_12", title: "Begin wedding dress shopping",                              order: 6 },
  { category: "9_12", title: "Book a hotel room block for out-of-town guests",            order: 7 },
  { category: "9_12", title: "Create your wedding website",                               order: 8 },
  { category: "9_12", title: "Send save-the-dates",                                       order: 9 },

  // 6–9 Months Before
  { category: "6_9", title: "Order your wedding dress",                                   order: 0 },
  { category: "6_9", title: "Book hair and makeup artists",                               order: 1 },
  { category: "6_9", title: "Book wedding transportation (limo, shuttle, classic car)",   order: 2 },
  { category: "6_9", title: "Book the rehearsal dinner venue",                            order: 3 },
  { category: "6_9", title: "Register for gifts",                                         order: 4 },
  { category: "6_9", title: "Book honeymoon travel and accommodations",                   order: 5 },
  { category: "6_9", title: "Research cake and dessert vendors",                          order: 6 },
  { category: "6_9", title: "Schedule engagement photo session",                          order: 7 },

  // 4–6 Months Before
  { category: "4_6", title: "Order wedding cake or desserts",                             order: 0 },
  { category: "4_6", title: "Book a florist",                                             order: 1 },
  { category: "4_6", title: "Order bridesmaids dresses",                                  order: 2 },
  { category: "4_6", title: "Order groomsmen attire (suits or tuxedos)",                  order: 3 },
  { category: "4_6", title: "Plan ceremony music selections",                             order: 4 },
  { category: "4_6", title: "Order wedding invitations and stationery suite",             order: 5 },
  { category: "4_6", title: "Purchase wedding party gifts",                               order: 6 },
  { category: "4_6", title: "Start planning wedding favors",                              order: 7 },

  // 2–4 Months Before
  { category: "2_4", title: "Send wedding invitations (8–10 weeks before)",               order: 0 },
  { category: "2_4", title: "Schedule first dress fitting for alterations",               order: 1 },
  { category: "2_4", title: "Purchase wedding bands",                                     order: 2 },
  { category: "2_4", title: "Select your rehearsal dinner look",                          order: 3 },
  { category: "2_4", title: "Finalize ceremony readings and order of service",            order: 4 },
  { category: "2_4", title: "Confirm all vendor contracts and final details",             order: 5 },
  { category: "2_4", title: "Send rehearsal dinner invitations",                          order: 6 },
  { category: "2_4", title: "Create a seating chart draft",                               order: 7 },
  { category: "2_4", title: "Finalize wedding day timeline",                              order: 8 },
  { category: "2_4", title: "Arrange marriage license appointment",                      order: 9 },

  // 6–8 Weeks Before
  { category: "6_8_weeks", title: "Follow up on outstanding RSVPs",                       order: 0 },
  { category: "6_8_weeks", title: "Submit final guest headcount to caterer and venue",    order: 1 },
  { category: "6_8_weeks", title: "Second dress fitting",                                 order: 2 },
  { category: "6_8_weeks", title: "Write personal wedding vows",                         order: 3 },
  { category: "6_8_weeks", title: "Create wedding party contact sheet and distribute",   order: 4 },
  { category: "6_8_weeks", title: "Finalize menu selections and dietary accommodations", order: 5 },
  { category: "6_8_weeks", title: "Order wedding programs",                               order: 6 },
  { category: "6_8_weeks", title: "Assign wedding day roles to family and friends",      order: 7 },

  // 2–4 Weeks Before
  { category: "2_4_weeks", title: "Final dress fitting and pick-up",                      order: 0 },
  { category: "2_4_weeks", title: "Deliver seating chart to venue",                      order: 1 },
  { category: "2_4_weeks", title: "Break in your wedding shoes",                          order: 2 },
  { category: "2_4_weeks", title: "Create day-of emergency kit (safety pins, pain reliever, snacks)", order: 3 },
  { category: "2_4_weeks", title: "Get marriage license",                                 order: 4 },
  { category: "2_4_weeks", title: "Finalize day-of vendor schedule and logistics",       order: 5 },
  { category: "2_4_weeks", title: "Prepare tip envelopes for vendors",                   order: 6 },

  // 1 Week Before
  { category: "1_week", title: "Attend wedding rehearsal",                                order: 0 },
  { category: "1_week", title: "Host or attend rehearsal dinner",                        order: 1 },
  { category: "1_week", title: "Steam or press wedding attire",                          order: 2 },
  { category: "1_week", title: "Pack for honeymoon",                                     order: 3 },

  // Wedding Day
  { category: "day_of", title: "Eat a proper breakfast",                                  order: 0 },
  { category: "day_of", title: "Exchange vows and get married",                          order: 1 },
  { category: "day_of", title: "Submit your marriage license paperwork",                 order: 2 },
];

// ── Schema ───────────────────────────────────────────────────────────────────

const addCustomItemSchema = z.object({
  title:    z.string().min(1, "Title is required").max(200),
  category: z.string().min(1, "Category is required"),
  dueDate:  z.string().optional().nullable(),
});

// ── Actions ──────────────────────────────────────────────────────────────────


type ExistingDefault = { title: string; completedAt: Date | null; category: string; dueDate: Date | null };

export async function initChecklistItemsAction(
  weddingId: string,
  weddingDate: Date,
  existingDefaults: ExistingDefault[],
) {
  // Build completion map so we preserve any checked-off tasks by title
  const completionMap = new Map<string, Date | null>(
    existingDefaults.map((i) => [i.title, i.completedAt])
  );

  // Delete all default tasks (custom tasks are preserved)
  await db.checklistItem.deleteMany({
    where: { weddingId, isCustom: false },
  });

  const dueDateByCategory: Record<string, Date> = {
    "12_plus":   subtractMonths(weddingDate, 13),
    "9_12":      subtractMonths(weddingDate, 10),
    "6_9":       subtractMonths(weddingDate, 7),
    "4_6":       subtractMonths(weddingDate, 5),
    "2_4":       subtractMonths(weddingDate, 3),
    "6_8_weeks": subtractWeeks(weddingDate, 7),
    "2_4_weeks": subtractWeeks(weddingDate, 3),
    "1_week":    subtractWeeks(weddingDate, 1),
    "day_of":    weddingDate,
  };

  await db.checklistItem.createMany({
    data: DEFAULT_TASKS.map((t) => ({
      weddingId,
      title:       t.title,
      category:    t.category,
      order:       t.order,
      isCustom:    false,
      dueDate:     dueDateByCategory[t.category],
      completedAt: completionMap.get(t.title) ?? null,
    })),
  });

  revalidatePath(REVALIDATE_PATH);
}

export async function toggleChecklistItemAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const item = await db.checklistItem.findFirst({
    where: { id, weddingId: wedding.id },
  });
  if (!item) throw new Error("Item not found.");

  await db.checklistItem.update({
    where: { id },
    data: { completedAt: item.completedAt ? null : new Date() },
  });

  revalidatePath(REVALIDATE_PATH);
  revalidateTag(`wedding-stats-${session.user.id}`);
}

export async function addCustomChecklistItemAction(formData: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = addCustomItemSchema.safeParse(formData);
  if (!parsed.success) throw new Error("Invalid input. Please check your data and try again.");

  const wedding = await getWeddingForUser(session.user.id);

  const last = await db.checklistItem.findFirst({
    where:   { weddingId: wedding.id, category: parsed.data.category },
    orderBy: { order: "desc" },
    select:  { order: true },
  });

  await db.checklistItem.create({
    data: {
      weddingId:  wedding.id,
      title:      parsed.data.title,
      category:   parsed.data.category,
      dueDate:    parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      isCustom:   true,
      order:      (last?.order ?? -1) + 1,
    },
  });

  revalidatePath(REVALIDATE_PATH);
  revalidateTag(`wedding-stats-${session.user.id}`);
}

export async function deleteChecklistItemAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const item = await db.checklistItem.findFirst({
    where: { id, weddingId: wedding.id },
  });
  if (!item) throw new Error("Item not found.");
  if (!item.isCustom) throw new Error("Default tasks cannot be deleted.");

  await db.checklistItem.delete({ where: { id } });

  revalidatePath(REVALIDATE_PATH);
  revalidateTag(`wedding-stats-${session.user.id}`);
}
