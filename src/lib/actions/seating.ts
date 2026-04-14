"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TableShape } from "@prisma/client";
import type { ClientTable, SeatPosition } from "@/lib/types/seating";

const REVALIDATE_PATH = "/dashboard/seating";

// ── Helpers ────────────────────────────────────────────────────────────────

function buildSeatPositions(
  assignments: { guestId: string; seatNumber: number | null }[]
): SeatPosition[] {
  const explicit: SeatPosition[] = [];
  const implicit: string[]       = [];

  for (const a of assignments) {
    if (a.seatNumber !== null) {
      explicit.push({ seatNumber: a.seatNumber, guestId: a.guestId });
    } else {
      implicit.push(a.guestId);
    }
  }

  const usedSeats = new Set(explicit.map((e) => e.seatNumber));
  const result: SeatPosition[] = [...explicit];
  let next = 1;
  for (const guestId of implicit) {
    while (usedSeats.has(next)) next++;
    result.push({ seatNumber: next, guestId });
    usedSeats.add(next);
    next++;
  }
  return result.sort((a, b) => a.seatNumber - b.seatNumber);
}

async function getWeddingForUser(userId: string) {
  const wedding = await db.wedding.findFirst({ where: { ownerId: userId } });
  if (!wedding) throw new Error("Wedding not found.");
  return wedding;
}

// ── Schemas ────────────────────────────────────────────────────────────────

const tableSchema = z.object({
  name:     z.string().min(1, "Table name is required").max(80),
  capacity: z.number().int().min(1, "Capacity must be at least 1").max(500),
  shape:    z.nativeEnum(TableShape),
  notes:    z.string().max(500).optional().nullable(),
});

const reorderSchema = z.array(
  z.object({
    id:        z.string(),
    sortOrder: z.number().int().min(0),
  })
);

// ── Table CRUD ─────────────────────────────────────────────────────────────

export async function createTableAction(formData: unknown): Promise<ClientTable> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const parsed = tableSchema.safeParse(formData);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const agg = await db.seatingTable.aggregate({
    _max: { sortOrder: true },
    where: { weddingId: wedding.id },
  });
  const nextOrder = (agg._max.sortOrder ?? -1) + 1;

  const table = await db.seatingTable.create({
    data: {
      ...parsed.data,
      weddingId: wedding.id,
      sortOrder: nextOrder,
    },
  });

  revalidatePath(REVALIDATE_PATH);
  return { ...table, guestIds: [], seatPositions: [] };
}

export async function updateTableAction(tableId: string, formData: unknown): Promise<ClientTable> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const existing = await db.seatingTable.findFirst({
    where: { id: tableId, weddingId: wedding.id },
  });
  if (!existing) throw new Error("Table not found.");

  const parsed = tableSchema.safeParse(formData);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const table = await db.seatingTable.update({
    where: { id: tableId },
    data:  parsed.data,
    include: { assignments: { select: { guestId: true, seatNumber: true } } },
  });

  revalidatePath(REVALIDATE_PATH);
  return {
    id:            table.id,
    name:          table.name,
    capacity:      table.capacity,
    shape:         table.shape,
    notes:         table.notes,
    sortOrder:     table.sortOrder,
    guestIds:      table.assignments.map((a) => a.guestId),
    seatPositions: buildSeatPositions(table.assignments),
  };
}

export async function deleteTableAction(tableId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const existing = await db.seatingTable.findFirst({
    where: { id: tableId, weddingId: wedding.id },
  });
  if (!existing) throw new Error("Table not found.");

  await db.seatingTable.delete({ where: { id: tableId } });

  revalidatePath(REVALIDATE_PATH);
}

export async function reorderTablesAction(
  updates: { id: string; sortOrder: number }[]
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = reorderSchema.safeParse(updates);
  if (!parsed.success) throw new Error("Invalid reorder data.");

  const wedding = await getWeddingForUser(session.user.id);

  await db.$transaction(
    parsed.data.map(({ id, sortOrder }) =>
      db.seatingTable.updateMany({
        where: { id, weddingId: wedding.id },
        data:  { sortOrder },
      })
    )
  );
  // No revalidatePath — client updates optimistically
}

// ── Guest Assignments ──────────────────────────────────────────────────────

export async function assignGuestAction(tableId: string, guestId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const table = await db.seatingTable.findFirst({
    where: { id: tableId, weddingId: wedding.id },
    include: { assignments: { select: { guestId: true } } },
  });
  if (!table) throw new Error("Table not found.");

  const guest = await db.guest.findFirst({
    where: { id: guestId, weddingId: wedding.id },
  });
  if (!guest) throw new Error("Guest not found.");

  const existingAssignment = await db.seatingAssignment.findUnique({
    where: { guestId },
  });
  if (existingAssignment) {
    if (existingAssignment.tableId === tableId) return; // already assigned here
    throw new Error("Guest is already assigned to another table. Move them instead.");
  }

  if (table.assignments.length >= table.capacity) {
    throw new Error(`${table.name} is at full capacity (${table.capacity} seats).`);
  }

  await db.seatingAssignment.create({ data: { tableId, guestId } });

  revalidatePath(REVALIDATE_PATH);
}

export async function unassignGuestAction(guestId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  // Ownership check: the assignment's guest must belong to user's wedding
  const assignment = await db.seatingAssignment.findUnique({
    where: { guestId },
    include: { guest: { select: { weddingId: true } } },
  });
  if (!assignment || assignment.guest.weddingId !== wedding.id) {
    throw new Error("Assignment not found.");
  }

  await db.seatingAssignment.delete({
    where: { guestId },
  });

  revalidatePath(REVALIDATE_PATH);
}

export async function moveGuestAction(
  fromTableId: string,
  toTableId: string,
  guestId: string
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const toTable = await db.seatingTable.findFirst({
    where: { id: toTableId, weddingId: wedding.id },
    include: { assignments: { select: { guestId: true } } },
  });
  if (!toTable) throw new Error("Destination table not found.");

  const fromTable = await db.seatingTable.findFirst({
    where: { id: fromTableId, weddingId: wedding.id },
  });
  if (!fromTable) throw new Error("Source table not found.");

  const guestAssigned = toTable.assignments.some((a) => a.guestId === guestId);
  const capacity = toTable.capacity;
  const currentCount = toTable.assignments.length;
  if (!guestAssigned && currentCount >= capacity) {
    throw new Error(`${toTable.name} is at full capacity (${capacity} seats).`);
  }

  await db.$transaction([
    db.seatingAssignment.delete({ where: { guestId } }),
    db.seatingAssignment.create({ data: { tableId: toTableId, guestId } }),
  ]);

  revalidatePath(REVALIDATE_PATH);
}

// ── Seat Assignment ────────────────────────────────────────────────────────

/** Assign a guest to a specific numbered seat at a table.
 *  - Guest must not already be assigned to a DIFFERENT table.
 *  - If they're already at this table, updates their seatNumber.
 *  - The target seat must not be occupied by a different guest.
 *  - If guestId is null, clears the seat (unassigns whoever sat there).
 */
export async function assignToSeatAction(
  tableId: string,
  seatNumber: number,
  guestId: string | null
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const table = await db.seatingTable.findFirst({
    where: { id: tableId, weddingId: wedding.id },
    include: { assignments: { select: { guestId: true, seatNumber: true } } },
  });
  if (!table) throw new Error("Table not found.");

  // ── Clearing a seat ──────────────────────────────────────────────────────
  if (guestId === null) {
    const existing = table.assignments.find((a) => a.seatNumber === seatNumber);
    if (existing) {
      await db.seatingAssignment.delete({ where: { guestId: existing.guestId } });
      revalidatePath(REVALIDATE_PATH);
    }
    return;
  }

  // ── Assigning a guest to a specific seat ─────────────────────────────────

  // Check that the guest belongs to this wedding
  const guest = await db.guest.findFirst({ where: { id: guestId, weddingId: wedding.id } });
  if (!guest) throw new Error("Guest not found.");

  // Check that the target seat isn't taken by a different guest
  const seatTakenBy = table.assignments.find(
    (a) => a.seatNumber === seatNumber && a.guestId !== guestId
  );
  if (seatTakenBy) throw new Error(`Seat ${seatNumber} is already occupied.`);

  // Check if the guest is already at this table
  const alreadyHere = table.assignments.find((a) => a.guestId === guestId);

  if (alreadyHere) {
    // Just update seatNumber
    await db.seatingAssignment.update({
      where: { guestId },
      data:  { seatNumber },
    });
  } else {
    // Guest may be at another table — not allowed (should move them first)
    const elsewhere = await db.seatingAssignment.findUnique({ where: { guestId } });
    if (elsewhere) throw new Error("Guest is already at another table. Move them first.");

    // Capacity check
    if (table.assignments.length >= table.capacity) {
      throw new Error(`${table.name} is at full capacity (${table.capacity} seats).`);
    }

    await db.seatingAssignment.create({ data: { tableId, guestId, seatNumber } });
  }

  revalidatePath(REVALIDATE_PATH);
}

// ── Auto-Assign ────────────────────────────────────────────────────────────

export async function autoAssignAction(): Promise<{ tablesUpdated: number; guestsSeated: number }> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  // Fetch tables with current assignment counts
  const tables = await db.seatingTable.findMany({
    where: { weddingId: wedding.id },
    include: { assignments: { select: { guestId: true } } },
    orderBy: { sortOrder: "asc" },
  });

  if (tables.length === 0) {
    throw new Error("Add at least one table before auto-assigning.");
  }

  // Fetch all confirmed guests (same filter as the page)
  const guestGroups = await db.guestGroup.findMany({
    where: { weddingId: wedding.id },
    include: {
      guests: { select: { id: true, groupId: true, isPlusOne: true } },
      rsvpResponse: { include: { eventResponses: true } },
    },
  });

  // Determine confirmed guests
  const confirmedGuestIds: string[] = [];
  const guestGroupMap: Record<string, string> = {}; // guestId → groupId

  for (const group of guestGroups) {
    const rsvp = group.rsvpResponse;
    if (!rsvp) continue;
    const groupAttends = rsvp.eventResponses.some((er) => er.attending);
    if (!groupAttends) continue;

    for (const guest of group.guests) {
      if (guest.isPlusOne && !rsvp.plusOneAttending) continue;
      confirmedGuestIds.push(guest.id);
      guestGroupMap[guest.id] = guest.groupId;
    }
  }

  // Find already-seated guest IDs
  const alreadySeated = new Set(tables.flatMap((t) => t.assignments.map((a) => a.guestId)));

  // Unassigned confirmed guests
  const unassigned = confirmedGuestIds.filter((id) => !alreadySeated.has(id));

  if (unassigned.length === 0) return { tablesUpdated: 0, guestsSeated: 0 };

  // Group unassigned by groupId (keep families together)
  const buckets = new Map<string, string[]>();
  for (const guestId of unassigned) {
    const groupId = guestGroupMap[guestId];
    if (!buckets.has(groupId)) buckets.set(groupId, []);
    buckets.get(groupId)!.push(guestId);
  }

  // Sort buckets largest-first
  const sortedBuckets = Array.from(buckets.values()).sort((a, b) => b.length - a.length);

  // Track available seats per table
  const available = new Map<string, number>(
    tables.map((t) => [t.id, t.capacity - t.assignments.length])
  );

  const newAssignments: { tableId: string; guestId: string }[] = [];
  const tablesUsed = new Set<string>();

  for (const bucket of sortedBuckets) {
    // Try to find a table that fits the whole bucket
    const tableForBucket = tables.find(
      (t) => (available.get(t.id) ?? 0) >= bucket.length
    );

    if (tableForBucket) {
      for (const guestId of bucket) {
        newAssignments.push({ tableId: tableForBucket.id, guestId });
        available.set(tableForBucket.id, (available.get(tableForBucket.id) ?? 0) - 1);
        tablesUsed.add(tableForBucket.id);
      }
    } else {
      // Split across tables with remaining space
      const remaining = [...bucket];
      for (const table of tables) {
        if (remaining.length === 0) break;
        const seats = available.get(table.id) ?? 0;
        if (seats <= 0) continue;
        const count = Math.min(remaining.length, seats);
        const toAssign = remaining.splice(0, count);
        for (const guestId of toAssign) {
          newAssignments.push({ tableId: table.id, guestId });
          tablesUsed.add(table.id);
        }
        available.set(table.id, seats - count);
      }
    }
  }

  if (newAssignments.length === 0) return { tablesUpdated: 0, guestsSeated: 0 };

  await db.$transaction(
    newAssignments.map(({ tableId, guestId }) =>
      db.seatingAssignment.upsert({
        where:  { guestId },
        create: { tableId, guestId },
        update: { tableId },
      })
    )
  );

  revalidatePath(REVALIDATE_PATH);

  return {
    tablesUpdated: tablesUsed.size,
    guestsSeated:  newAssignments.length,
  };
}
