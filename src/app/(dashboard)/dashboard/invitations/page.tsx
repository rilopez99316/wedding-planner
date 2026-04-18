import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import InvitationsClient from "@/components/dashboard/InvitationsClient";

async function getInvitationData(userId: string) {
  const wedding = await db.wedding.findFirst({
    where: { ownerId: userId },
    include: {
      guestGroups: {
        include: {
          guests: { where: { isPlusOne: false } },
          rsvpResponse: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  return wedding;
}

export default async function InvitationsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const wedding = await getInvitationData(session.user.id);
  if (!wedding) redirect("/dashboard");

  return (
    <DashboardShell
      heading="Invitations"
    >
      <InvitationsClient groups={wedding.guestGroups} />
    </DashboardShell>
  );
}
