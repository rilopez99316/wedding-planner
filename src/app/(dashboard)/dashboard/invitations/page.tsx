import { auth } from "@/lib/auth";
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
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const wedding = await getInvitationData(session.user.id);
  if (!wedding) redirect("/dashboard");

  const notInvited = wedding.guestGroups.filter(
    (g) => !g.guests.some((gu) => gu.invitationSentAt)
  ).length;
  const notResponded = wedding.guestGroups.filter(
    (g) => g.guests.some((gu) => gu.invitationSentAt) && !g.rsvpResponse
  ).length;

  return (
    <DashboardShell
      heading="Invitations"
    >
      <InvitationsClient groups={wedding.guestGroups} />
    </DashboardShell>
  );
}
