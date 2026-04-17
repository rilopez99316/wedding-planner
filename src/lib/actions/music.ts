"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const REVALIDATE_PATH = "/dashboard/music";

// ── Internal helpers ───────────────────────────────────────────────────────

async function getWeddingForUser(userId: string) {
  const wedding = await db.wedding.findFirst({ where: { ownerId: userId } });
  if (!wedding) throw new Error("Wedding not found.");
  return wedding;
}

async function getOrCreateMusicPlan(weddingId: string) {
  const existing = await db.musicPlan.findUnique({ where: { weddingId } });
  if (existing) return existing;
  return db.musicPlan.create({ data: { weddingId } });
}

// ── Schemas ────────────────────────────────────────────────────────────────

const receptionSongsSchema = z.object({
  grandEntranceSong:        z.string().max(300).nullable().optional(),
  firstDanceSong:           z.string().max(300).nullable().optional(),
  fatherDaughterSong:       z.string().max(300).nullable().optional(),
  motherSonSong:            z.string().max(300).nullable().optional(),
  weddingPartyEntranceSong: z.string().max(300).nullable().optional(),
  cakeCuttingSong:          z.string().max(300).nullable().optional(),
  lastDanceSong:            z.string().max(300).nullable().optional(),
});

const songSchema = z.object({
  title:    z.string().min(1, "Song title is required").max(200),
  artist:   z.string().max(200).nullable().optional(),
  listType: z.enum(["must_play", "do_not_play"]),
});

const djNotesSchema = z.object({
  djNotes: z.string().max(5000).nullable().optional(),
});

const playlistUrlSchema = z.object({
  listType: z.enum(["must_play", "do_not_play"]),
  url: z.string().url("Must be a valid URL").max(2000).nullable(),
});

// ── Actions ────────────────────────────────────────────────────────────────

export async function updateReceptionSongsAction(data: unknown): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = receptionSongsSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid data.");

  const wedding = await getWeddingForUser(session.user.id);
  const plan = await getOrCreateMusicPlan(wedding.id);

  await db.musicPlan.update({
    where: { id: plan.id },
    data: {
      grandEntranceSong:        parsed.data.grandEntranceSong        ?? null,
      firstDanceSong:           parsed.data.firstDanceSong           ?? null,
      fatherDaughterSong:       parsed.data.fatherDaughterSong       ?? null,
      motherSonSong:            parsed.data.motherSonSong            ?? null,
      weddingPartyEntranceSong: parsed.data.weddingPartyEntranceSong ?? null,
      cakeCuttingSong:          parsed.data.cakeCuttingSong          ?? null,
      lastDanceSong:            parsed.data.lastDanceSong            ?? null,
    },
  });

  revalidatePath(REVALIDATE_PATH);
}

export async function updateDjNotesAction(data: unknown): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = djNotesSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid data.");

  const wedding = await getWeddingForUser(session.user.id);
  const plan = await getOrCreateMusicPlan(wedding.id);

  await db.musicPlan.update({
    where: { id: plan.id },
    data: { djNotes: parsed.data.djNotes ?? null },
  });

  revalidatePath(REVALIDATE_PATH);
}

export async function addMusicSongAction(data: unknown) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = songSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid input. Please check your data and try again.");

  const wedding = await getWeddingForUser(session.user.id);
  const plan = await getOrCreateMusicPlan(wedding.id);

  const maxOrder = await db.musicSong.aggregate({
    where: { musicPlanId: plan.id, listType: parsed.data.listType },
    _max:  { order: true },
  });
  const order = (maxOrder._max.order ?? -1) + 1;

  const song = await db.musicSong.create({
    data: {
      musicPlanId: plan.id,
      title:       parsed.data.title,
      artist:      parsed.data.artist ?? null,
      listType:    parsed.data.listType,
      order,
    },
  });

  revalidatePath(REVALIDATE_PATH);
  return song;
}

export async function updatePlaylistUrlAction(data: unknown): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const parsed = playlistUrlSchema.safeParse(data);
  if (!parsed.success) throw new Error("Invalid data.");

  const wedding = await getWeddingForUser(session.user.id);
  const plan = await getOrCreateMusicPlan(wedding.id);

  const field =
    parsed.data.listType === "must_play"
      ? "mustPlayPlaylistUrl"
      : "doNotPlayPlaylistUrl";

  await db.musicPlan.update({
    where: { id: plan.id },
    data: { [field]: parsed.data.url },
  });

  revalidatePath(REVALIDATE_PATH);
}

export async function deleteMusicSongAction(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized.");

  const wedding = await getWeddingForUser(session.user.id);

  const existing = await db.musicSong.findFirst({
    where: { id, musicPlan: { weddingId: wedding.id } },
  });
  if (!existing) throw new Error("Song not found.");

  await db.musicSong.delete({ where: { id } });

  revalidatePath(REVALIDATE_PATH);
}
