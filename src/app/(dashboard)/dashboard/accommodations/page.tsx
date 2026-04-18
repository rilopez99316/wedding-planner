import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import AccommodationsClient from "@/components/dashboard/AccommodationsClient";

export default async function AccommodationsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const wedding = await db.wedding.findFirst({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      accommodations: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!wedding) redirect("/dashboard");

  const totalRooms = wedding.accommodations.reduce(
    (sum, h) => sum + (h.roomsTotal ?? 0),
    0
  );
  const bookedRooms = wedding.accommodations.reduce(
    (sum, h) => sum + h.roomsBooked,
    0
  );

  const parts: string[] = [];
  if (wedding.accommodations.length > 0) {
    parts.push(
      `${wedding.accommodations.length} hotel${wedding.accommodations.length !== 1 ? "s" : ""}`
    );
  }
  if (totalRooms > 0) {
    parts.push(`${bookedRooms} / ${totalRooms} rooms booked`);
  }

  return (
    <DashboardShell
      heading="Accommodations"
      subheading={parts.length > 0 ? parts.join(" · ") : "No hotels added yet"}
    >
      <AccommodationsClient hotels={wedding.accommodations} />
    </DashboardShell>
  );
}
