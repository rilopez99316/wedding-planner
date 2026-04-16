import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import GuestTable from "@/components/dashboard/GuestTable";
import AddGuestDialog from "@/components/dashboard/AddGuestDialog";
import EmptyState from "@/components/ui/EmptyState";

async function getGuestData(userId: string) {
  const wedding = await db.wedding.findFirst({
    where: { ownerId: userId },
    include: {
      guestGroups: {
        include: {
          guests: true,
          rsvpResponse: true,
          allowedEvents: { include: { event: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      events: { orderBy: { order: "asc" } },
    },
  });
  return wedding;
}

export default async function GuestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const wedding = await getGuestData(session.user.id);
  if (!wedding) redirect("/dashboard");

  const totalGuests = wedding.guestGroups.reduce((sum, g) => sum + g.guests.length, 0);

  return (
    <DashboardShell
      heading="Guest List"
      action={<AddGuestDialog weddingId={wedding.id} events={wedding.events} />}
    >
      {wedding.guestGroups.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          title="No guests yet"
          description="Add your first guest group to get started. Guests can be families, couples, or individuals."
          action={<AddGuestDialog weddingId={wedding.id} events={wedding.events} />}
        />
      ) : (
        <GuestTable groups={wedding.guestGroups} events={wedding.events} weddingId={wedding.id} />
      )}
    </DashboardShell>
  );
}
