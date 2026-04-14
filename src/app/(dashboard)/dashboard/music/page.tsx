import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import MusicClient from "@/components/dashboard/MusicClient";

export default async function MusicPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const wedding = await db.wedding.findFirst({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      ceremonyProgram: {
        select: { processionalSong: true, recessionalSong: true },
      },
      musicPlan: {
        include: {
          songs: { orderBy: [{ listType: "asc" }, { order: "asc" }] },
        },
      },
    },
  });

  if (!wedding) redirect("/dashboard");

  const plan = wedding.musicPlan;
  const mustPlay  = plan?.songs.filter((s) => s.listType === "must_play")  ?? [];
  const doNotPlay = plan?.songs.filter((s) => s.listType === "do_not_play") ?? [];

  const songCount = mustPlay.length + doNotPlay.length;
  const subheading = songCount > 0
    ? `${songCount} song${songCount !== 1 ? "s" : ""} in your lists`
    : "Ceremony, reception, and playlist notes";

  return (
    <DashboardShell heading="Music" subheading={subheading}>
      <MusicClient
        ceremonySongs={{
          processionalSong: wedding.ceremonyProgram?.processionalSong ?? null,
          recessionalSong:  wedding.ceremonyProgram?.recessionalSong  ?? null,
        }}
        receptionSongs={{
          grandEntranceSong:        plan?.grandEntranceSong        ?? null,
          firstDanceSong:           plan?.firstDanceSong           ?? null,
          fatherDaughterSong:       plan?.fatherDaughterSong       ?? null,
          motherSonSong:            plan?.motherSonSong            ?? null,
          weddingPartyEntranceSong: plan?.weddingPartyEntranceSong ?? null,
          cakeCuttingSong:          plan?.cakeCuttingSong          ?? null,
          lastDanceSong:            plan?.lastDanceSong            ?? null,
        }}
        djNotes={plan?.djNotes ?? null}
        mustPlayPlaylistUrl={plan?.mustPlayPlaylistUrl ?? null}
        doNotPlayPlaylistUrl={plan?.doNotPlayPlaylistUrl ?? null}
        initialMustPlay={mustPlay.map((s) => ({ id: s.id, title: s.title, artist: s.artist }))}
        initialDoNotPlay={doNotPlay.map((s) => ({ id: s.id, title: s.title, artist: s.artist }))}
      />
    </DashboardShell>
  );
}
