import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import WeddingPartyClient from "@/components/dashboard/WeddingPartyClient";

export default async function WeddingPartyPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const wedding = await db.wedding.findFirst({ where: { ownerId: session.user.id } });
  if (!wedding) redirect("/onboarding");

  const members = await db.weddingPartyMember.findMany({
    where:   { weddingId: wedding.id },
    orderBy: { displayOrder: "asc" },
  });

  const count = members.length;
  const subheading = count === 0
    ? "No members yet"
    : `${count} member${count !== 1 ? "s" : ""}`;

  return (
    <DashboardShell heading="Wedding Party" subheading={subheading}>
      <WeddingPartyClient initialMembers={members} />
    </DashboardShell>
  );
}
