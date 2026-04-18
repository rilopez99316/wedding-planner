import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ResponsesClient, { type RespondedGroup, type NotRespondedGroup } from "@/components/dashboard/ResponsesClient";
import { formatRelativeTime } from "@/lib/utils";

export default async function ResponsesPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const wedding = await db.wedding.findFirst({
    where: { ownerId: session.user.id },
    include: {
      guestGroups: {
        include: {
          guests: {
            include: { dietaryRestrictions: true },
          },
          rsvpResponse: {
            include: { eventResponses: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      events: { orderBy: { order: "asc" } },
    },
  });

  if (!wedding) redirect("/dashboard");

  // Pre-compute responded groups with display-ready data
  const responded: RespondedGroup[] = wedding.guestGroups
    .filter((g) => g.rsvpResponse)
    .map((group) => {
      const response = group.rsvpResponse!;
      const attending = response.eventResponses.some((e) => e.attending);

      const eventResponses = response.eventResponses.map((er) => {
        const event = wedding.events.find((e) => e.key === er.eventKey);
        return { key: er.eventKey, label: event?.label ?? er.eventKey, attending: er.attending };
      });

      const dietaryChips = Array.from(
        new Set(
          group.guests.flatMap((g) => g.dietaryRestrictions.map((d) => d.restriction))
        )
      );

      const guestNames = group.guests
        .map((g) => `${g.firstName} ${g.lastName}`)
        .join(", ");

      let plusOneLine: string | null = null;
      if (response.plusOneAttending && response.plusOneName) {
        plusOneLine = `+ ${response.plusOneName}`;
      } else if (response.plusOneAttending) {
        plusOneLine = "+ plus-one";
      }

      return {
        id: group.id,
        groupName: group.groupName,
        attending,
        guestNames,
        plusOneLine,
        eventResponses,
        dietaryChips,
        relativeTime: formatRelativeTime(response.submittedAt),
      };
    });

  const notResponded: NotRespondedGroup[] = wedding.guestGroups
    .filter((g) => !g.rsvpResponse)
    .map((group) => ({
      id: group.id,
      groupName: group.groupName,
      guestCount: group.guests.length,
    }));

  const totalAttending = responded.reduce((sum, g) => {
    if (!g.attending) return sum;
    // Count actual guests by matching against group data
    const group = wedding.guestGroups.find((wg) => wg.id === g.id);
    const base = group?.guests.filter((gu) => !gu.isPlusOne).length ?? 0;
    const plusOne = group?.rsvpResponse?.plusOneAttending ? 1 : 0;
    return sum + base + plusOne;
  }, 0);

  const totalDeclined = responded.filter((g) => !g.attending).length;

  return (
    <DashboardShell
      heading="RSVP Responses"
    >
      <ResponsesClient
        responded={responded}
        notResponded={notResponded}
        totalGroups={wedding.guestGroups.length}
        totalAttending={totalAttending}
        totalDeclined={totalDeclined}
      />
    </DashboardShell>
  );
}
