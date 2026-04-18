import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import TimelineClient from "@/components/dashboard/TimelineClient";

export default async function TimelinePage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const wedding = await db.wedding.findFirst({
    where: { ownerId: session.user.id },
    select: {
      id:           true,
      weddingDate:  true,
      partner1Name: true,
      partner2Name: true,
      timelineEvents: {
        orderBy: { startTime: "asc" },
      },
    },
  });

  if (!wedding) redirect("/dashboard");

  const count = wedding.timelineEvents.length;

  return (
    <DashboardShell
      heading="Day-of Timeline"
      subheading={count === 0 ? "No events yet" : `${count} event${count !== 1 ? "s" : ""}`}
    >
      <TimelineClient
        weddingId={wedding.id}
        weddingDate={wedding.weddingDate}
        partner1Name={wedding.partner1Name}
        partner2Name={wedding.partner2Name}
        initialEvents={wedding.timelineEvents.map((e) => ({
          id:         e.id,
          title:      e.title,
          startTime:  e.startTime.toISOString(),
          endTime:    e.endTime?.toISOString() ?? null,
          category:   e.category,
          location:   e.location,
          assignedTo: e.assignedTo,
          notes:      e.notes,
          order:      e.order,
        }))}
      />
    </DashboardShell>
  );
}
