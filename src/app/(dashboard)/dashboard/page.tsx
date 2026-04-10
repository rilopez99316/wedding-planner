import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { formatDate, formatDateTime } from "@/lib/utils";

async function getWeddingStats(userId: string) {
  const wedding = await db.wedding.findFirst({
    where: { ownerId: userId },
    include: {
      guestGroups: {
        include: {
          guests: true,
          rsvpResponse: true,
        },
      },
      events: { orderBy: { order: "asc" } },
    },
  });

  if (!wedding) return null;

  const totalGroups = wedding.guestGroups.length;
  const totalGuests = wedding.guestGroups.reduce((sum, g) => sum + g.guests.length, 0);
  const responded = wedding.guestGroups.filter((g) => g.rsvpResponse).length;
  const attending = wedding.guestGroups.filter((g) => g.rsvpResponse?.plusOneAttending !== undefined).length;
  const notInvited = wedding.guestGroups.filter((g) => !g.guests.some((gu) => gu.invitationSentAt)).length;

  const daysUntilWedding = Math.ceil(
    (new Date(wedding.weddingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const daysUntilDeadline = Math.ceil(
    (new Date(wedding.rsvpDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return {
    wedding,
    stats: {
      totalGuests,
      totalGroups,
      responded,
      responseRate: totalGroups ? Math.round((responded / totalGroups) * 100) : 0,
      notInvited,
      daysUntilWedding,
      daysUntilDeadline,
    },
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const data = await getWeddingStats(session.user.id);

  if (!data) {
    return (
      <DashboardShell heading="Welcome to Vows">
        <div className="max-w-md mx-auto text-center py-16">
          <p className="text-gray-500 mb-4">No wedding found. Something may have gone wrong during signup.</p>
          <Link href="/signup" className="text-accent font-medium hover:underline">
            Set up your wedding
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const { wedding, stats } = data;
  const coupleNames = `${wedding.partner1Name} & ${wedding.partner2Name}`;

  const statCards = [
    { label: "Total Guests", value: stats.totalGuests, sub: `in ${stats.totalGroups} groups` },
    { label: "RSVPs Received", value: stats.responded, sub: `${stats.responseRate}% response rate` },
    { label: "Awaiting RSVP", value: stats.totalGroups - stats.responded, sub: "groups haven't responded" },
    {
      label: stats.daysUntilWedding > 0 ? "Days Until Wedding" : "Wedding Day",
      value: stats.daysUntilWedding > 0 ? stats.daysUntilWedding : "Today! 🎉",
      sub: formatDate(wedding.weddingDate),
    },
  ];

  return (
    <DashboardShell
      heading={coupleNames}
      subheading={`${formatDate(wedding.weddingDate)} · ${wedding.venueName ?? "Venue TBD"}`}
    >
      <div className="max-w-5xl mx-auto space-y-8">
        {/* RSVP deadline alert */}
        {stats.daysUntilDeadline > 0 && stats.daysUntilDeadline <= 14 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
            <span className="text-amber-500">⚠️</span>
            <p className="text-sm text-amber-800 font-medium">
              RSVP deadline is in {stats.daysUntilDeadline} day{stats.daysUntilDeadline !== 1 ? "s" : ""} —{" "}
              <Link href="/dashboard/invitations" className="underline">send reminders</Link> to guests who haven&apos;t responded.
            </p>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white rounded-lg shadow-apple-sm border border-gray-100 p-5">
              <div className="text-2xl font-semibold text-gray-900 tabular-nums">{card.value}</div>
              <div className="text-xs font-medium text-gray-900 mt-1">{card.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Add guests", icon: "👥", href: "/dashboard/guests", description: "Add your guest list" },
              { label: "Send invitations", icon: "✉️", href: "/dashboard/invitations", description: "Email your RSVP invites" },
              { label: "View responses", icon: "✅", href: "/dashboard/responses", description: "See who's coming" },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="bg-white rounded-lg border border-gray-100 shadow-apple-sm p-4 flex items-center gap-4 hover:shadow-apple-md transition-all duration-200 group"
              >
                <span className="text-2xl">{action.icon}</span>
                <div>
                  <div className="text-sm font-medium text-gray-900 group-hover:text-accent transition-colors">{action.label}</div>
                  <div className="text-xs text-gray-400">{action.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Events */}
        {wedding.events.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Wedding events</h2>
            <div className="bg-white rounded-lg border border-gray-100 shadow-apple-sm divide-y divide-gray-100">
              {wedding.events.map((event) => (
                <div key={event.id} className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{event.label}</span>
                  <span className="text-xs text-gray-400">{formatDateTime(event.date)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Your public page */}
        <div className="bg-accent-light rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-accent">Your public wedding page</p>
            <p className="text-xs text-accent/70 mt-0.5">Share this with your guests</p>
          </div>
          <Link
            href={`/${wedding.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 bg-accent text-white text-xs font-medium px-3 py-1.5 rounded-md hover:brightness-105 transition-all"
          >
            vows.app/{wedding.slug}
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
