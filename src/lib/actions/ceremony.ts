"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { DEFAULT_CEREMONY_ITEMS } from "@/lib/ceremony-constants";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const REVALIDATE_PATH = "/dashboard/ceremony";

// ── Token helpers ──────────────────────────────────────────────────────────

const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function getSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET not set.");
  return s;
}

function signVowsToken(partner: "partner1" | "partner2", weddingId: string): string {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `${partner}:${weddingId}:${expires}`;
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

function verifyVowsToken(
  token: string,
  partner: "partner1" | "partner2",
  weddingId: string
): boolean {
  try {
    const [b64, sig] = token.split(".");
    if (!b64 || !sig) return false;
    const payload = Buffer.from(b64, "base64url").toString("utf8");
    const expected = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return false;
    const [p, w, expiresStr] = payload.split(":");
    if (p !== partner || w !== weddingId) return false;
    const expires = parseInt(expiresStr, 10);
    if (isNaN(expires) || Date.now() > expires) return false;
    return true;
  } catch {
    return false;
  }
}

function vowsSessionCookieName(partner: "partner1" | "partner2"): string {
  return `vowsSession_${partner}`;
}

// ── Internal helpers ───────────────────────────────────────────────────────

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
  type: z.enum([
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

const musicSchema = z.object({
  processionalSong: z.string().max(300).nullable().optional(),
  recessionalSong:  z.string().max(300).nullable().optional(),
});

// ── Vows: Identity cookie ──────────────────────────────────────────────────

export async function setVowsPartnerAction(partner: "partner1" | "partner2") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const cookieStore = await cookies();
  cookieStore.set("vowsPartner", partner, {
    path:    "/",
    maxAge:  60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

// ── Vows: PIN setup (first time only) ─────────────────────────────────────

export async function setVowsPinAction(
  partner: "partner1" | "partner2",
  pin: string
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");
  if (!pin || pin.length < 4) throw new Error("PIN must be at least 4 characters.");

  const wedding = await getWeddingForUser(session.user.id);
  const program = await getOrCreateProgram(wedding.id);

  const pinField    = partner === "partner1" ? "partner1VowsPin" : "partner2VowsPin";
  const existingPin = program[pinField];
  if (existingPin) throw new Error("A PIN is already set. Contact your partner to discuss.");

  const hash = await bcrypt.hash(pin, 12);

  await db.ceremonyProgram.update({
    where: { id: program.id },
    data:  { [pinField]: hash },
  });

  // Grant session cookie immediately after setting PIN
  const token = signVowsToken(partner, wedding.id);
  const cookieStore = await cookies();
  cookieStore.set(vowsSessionCookieName(partner), token, {
    httpOnly: true,
    path:     "/",
    maxAge:   SESSION_TTL_MS / 1000,
    sameSite: "lax",
  });
}

// ── Vows: Lock (clear session cookie after save) ──────────────────────────

export async function lockVowsSessionAction(
  partner: "partner1" | "partner2"
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(vowsSessionCookieName(partner));
}

// ── Vows: Auto-unlock if session cookie is still valid ────────────────────

export async function getVowTextIfUnlockedAction(
  partner: "partner1" | "partner2"
): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const wedding = await getWeddingForUser(session.user.id);
  const cookieStore = await cookies();
  const token = cookieStore.get(vowsSessionCookieName(partner))?.value;
  if (!token || !verifyVowsToken(token, partner, wedding.id)) return null;

  const program = await db.ceremonyProgram.findUnique({ where: { weddingId: wedding.id } });
  if (!program) return null;

  const vowsField = partner === "partner1" ? "partner1Vows" : "partner2Vows";
  return program[vowsField] ?? null;
}

// ── Vows: Reset PIN (forgot PIN — clears vow text too) ────────────────────

export async function resetVowsPinAction(
  partner: "partner1" | "partner2"
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);
  const program = await db.ceremonyProgram.findUnique({ where: { weddingId: wedding.id } });
  if (!program) return;

  const pinField    = partner === "partner1" ? "partner1VowsPin"    : "partner2VowsPin";
  const vowsField   = partner === "partner1" ? "partner1Vows"       : "partner2Vows";
  const statusField = partner === "partner1" ? "partner1VowsStatus" : "partner2VowsStatus";

  await db.ceremonyProgram.update({
    where: { id: program.id },
    data:  { [pinField]: null, [vowsField]: null, [statusField]: "not_started" },
  });

  // Clear the session cookie
  const cookieStore = await cookies();
  cookieStore.delete(vowsSessionCookieName(partner));

  revalidatePath(REVALIDATE_PATH);
}

// ── Vows: Unlock (returning visit) ────────────────────────────────────────

export async function unlockVowsAction(
  partner: "partner1" | "partner2",
  pin: string
): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);
  const program = await db.ceremonyProgram.findUnique({ where: { weddingId: wedding.id } });
  if (!program) throw new Error("Program not found.");

  const pinField  = partner === "partner1" ? "partner1VowsPin"  : "partner2VowsPin";
  const vowsField = partner === "partner1" ? "partner1Vows"     : "partner2Vows";
  const storedPin = program[pinField];

  if (!storedPin) throw new Error("No PIN set for this partner yet.");

  const match = await bcrypt.compare(pin, storedPin);
  if (!match) throw new Error("Incorrect PIN.");

  // Set session cookie
  const token = signVowsToken(partner, wedding.id);
  const cookieStore = await cookies();
  cookieStore.set(vowsSessionCookieName(partner), token, {
    httpOnly: true,
    path:     "/",
    maxAge:   SESSION_TTL_MS / 1000,
    sameSite: "lax",
  });

  return program[vowsField] ?? null;
}

// ── Vows: Save text + status ───────────────────────────────────────────────

export async function updateVowsAction(
  partner: "partner1" | "partner2",
  text: string | null,
  status: "not_started" | "in_progress" | "ready"
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  // Verify session cookie
  const cookieStore = await cookies();
  const token = cookieStore.get(vowsSessionCookieName(partner))?.value;
  if (!token || !verifyVowsToken(token, partner, wedding.id)) {
    throw new Error("Session expired — re-enter your PIN.");
  }

  const program = await getOrCreateProgram(wedding.id);

  const vowsField  = partner === "partner1" ? "partner1Vows"       : "partner2Vows";
  const statusField = partner === "partner1" ? "partner1VowsStatus" : "partner2VowsStatus";

  await db.ceremonyProgram.update({
    where: { id: program.id },
    data:  { [vowsField]: text ?? null, [statusField]: status },
  });

  revalidatePath(REVALIDATE_PATH);
}

// ── Ceremony items ────────────────────────────────────────────────────────

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
  revalidatePath("/dashboard/music");
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
