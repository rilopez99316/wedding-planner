import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import CeremonyClient from "@/components/dashboard/CeremonyClient";

export default async function CeremonyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const cookieStore = await cookies();
  const rawPartner = cookieStore.get("vowsPartner")?.value;
  const currentPartner: "partner1" | "partner2" | null =
    rawPartner === "partner1" || rawPartner === "partner2" ? rawPartner : null;

  const wedding = await db.wedding.findFirst({
    where: { ownerId: session.user.id },
    select: {
      id:           true,
      partner1Name: true,
      partner2Name: true,
      ceremonyProgram: {
        include: {
          items: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!wedding) redirect("/dashboard");

  const program = wedding.ceremonyProgram ?? null;
  const items   = program?.items ?? [];
  const count   = items.length;

  return (
    <DashboardShell
      heading="Ceremony"
      subheading={count === 0 ? "No program items yet" : `${count} item${count !== 1 ? "s" : ""} in program`}
    >
      <CeremonyClient
        program={program ? {
          id:                 program.id,
          partner1HasPin:     !!program.partner1VowsPin,
          partner2HasPin:     !!program.partner2VowsPin,
          partner1VowsStatus: program.partner1VowsStatus,
          partner2VowsStatus: program.partner2VowsStatus,
          processionalSong:   program.processionalSong,
          recessionalSong:    program.recessionalSong,
        } : null}
        initialItems={items.map((item) => ({
          id:          item.id,
          programId:   item.programId,
          type:        item.type,
          title:       item.title,
          description: item.description,
          assignedTo:  item.assignedTo,
          notes:       item.notes,
          order:       item.order,
        }))}
        partner1Name={wedding.partner1Name}
        partner2Name={wedding.partner2Name}
        currentPartner={currentPartner}
        weddingId={wedding.id}
      />
    </DashboardShell>
  );
}
