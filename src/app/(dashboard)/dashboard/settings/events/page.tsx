import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import EventsManager from "@/components/dashboard/EventsManager";

export default async function EventsSettingsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const wedding = await db.wedding.findFirst({
    where: { ownerId: session.user.id },
    include: { events: { orderBy: { order: "asc" } } },
  });

  if (!wedding) redirect("/dashboard");

  return (
    <DashboardShell
      heading="Events"
      subheading="Add and manage the events guests can RSVP to."
      backHref="/dashboard/settings"
      backLabel="Settings"
    >
      <EventsManager
        weddingSlug={wedding.slug}
        events={wedding.events.map((e) => ({
          id:       e.id,
          key:      e.key,
          label:    e.label,
          date:     e.date.toISOString().slice(0, 16),
          location: e.location ?? "",
          notes:    e.notes ?? "",
          order:    e.order,
        }))}
      />
    </DashboardShell>
  );
}
