import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import CeremonyClient from "@/components/dashboard/CeremonyClient";

export default async function CeremonyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

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
          id:               program.id,
          partner1Vows:     program.partner1Vows,
          partner2Vows:     program.partner2Vows,
          processionalSong: program.processionalSong,
          recessionalSong:  program.recessionalSong,
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
      />
    </DashboardShell>
  );
}
