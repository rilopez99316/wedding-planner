import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import CommunicationsClient from "@/components/dashboard/CommunicationsClient";

export default async function CommunicationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const wedding = await db.wedding.findFirst({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      partner1Name: true,
      partner2Name: true,
      guestMessages: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!wedding) redirect("/dashboard");

  const [guestCount, attendingCount] = await Promise.all([
    db.guest.count({
      where: { weddingId: wedding.id, isPlusOne: false },
    }),
    db.guest.count({
      where: {
        weddingId: wedding.id,
        isPlusOne: false,
        group: { rsvpResponse: { isNot: null } },
      },
    }),
  ]);

  const sentMessages = wedding.guestMessages.filter((m) => m.status === "sent");
  const totalSent = sentMessages.length;
  const guestsReached = sentMessages.reduce(
    (sum, m) => sum + (m.totalSent ?? 0),
    0
  );
  const subheadingParts: string[] = [];
  if (totalSent > 0) subheadingParts.push(`${totalSent} message${totalSent !== 1 ? "s" : ""} sent`);

  return (
    <DashboardShell
      heading="Communications"
      subheading={
        subheadingParts.length > 0
          ? subheadingParts.join(" · ")
          : "Send heartfelt messages to your guests"
      }
    >
      <CommunicationsClient
        messages={wedding.guestMessages.map((m) => ({
          ...m,
          sentAt: m.sentAt?.toISOString() ?? null,
          scheduledAt: m.scheduledAt?.toISOString() ?? null,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        }))}
        stats={{ totalSent, guestsReached }}
        guestCounts={{ total: guestCount, attending: attendingCount }}
      />
    </DashboardShell>
  );
}
