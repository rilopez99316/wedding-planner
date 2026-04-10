import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

export default async function ResponsesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const wedding = await db.wedding.findFirst({
    where: { ownerId: session.user.id },
    include: {
      guestGroups: {
        include: {
          guests: true,
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

  const responded = wedding.guestGroups.filter((g) => g.rsvpResponse);
  const totalGuests = responded.reduce((sum, g) => {
    const base = g.guests.filter((gu) => !gu.isPlusOne).length;
    const plusOne = g.rsvpResponse?.plusOneAttending ? 1 : 0;
    return sum + base + plusOne;
  }, 0);

  return (
    <DashboardShell
      heading="RSVP Responses"
      subheading={`${responded.length} of ${wedding.guestGroups.length} groups responded · ${totalGuests} guests attending`}
    >
      {responded.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="No responses yet"
          description="Once guests submit their RSVPs, their responses will appear here."
        />
      ) : (
        <div className="max-w-4xl space-y-4">
          {responded.map((group) => {
            const response = group.rsvpResponse!;
            const attending = response.eventResponses.some((e) => e.attending);
            const primaryGuest = group.guests.find((g) => !g.isPlusOne);

            return (
              <div key={group.id} className="bg-white rounded-lg shadow-apple-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">{group.groupName}</span>
                      <Badge variant={attending ? "success" : "danger"}>
                        {attending ? "Attending" : "Declined"}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-400">
                      {group.guests.map((g) => `${g.firstName} ${g.lastName}`).join(", ")}
                      {response.plusOneAttending && response.plusOneName && (
                        <span> + {response.plusOneName}</span>
                      )}
                      {response.plusOneAttending && !response.plusOneName && (
                        <span> + plus-one</span>
                      )}
                    </div>
                    {response.eventResponses.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {response.eventResponses.map((er) => {
                          const event = wedding.events.find((e) => e.key === er.eventKey);
                          return (
                            <span
                              key={er.id}
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                er.attending
                                  ? "bg-green-50 text-green-700"
                                  : "bg-gray-100 text-gray-400 line-through"
                              }`}
                            >
                              {event?.label ?? er.eventKey}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 shrink-0">
                    {formatDate(response.submittedAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
