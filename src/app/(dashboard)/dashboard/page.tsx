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
      checklistItems: { select: { completedAt: true } },
      vendors: { select: { id: true, status: true } },
    },
  });

  if (!wedding) return null;

  const totalGroups = wedding.guestGroups.length;
  const totalGuests = wedding.guestGroups.reduce((sum, g) => sum + g.guests.length, 0);
  const responded   = wedding.guestGroups.filter((g) => g.rsvpResponse).length;

  const daysUntilWedding = Math.ceil(
    (new Date(wedding.weddingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const daysUntilDeadline = Math.ceil(
    (new Date(wedding.rsvpDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const totalChecklist     = wedding.checklistItems.length;
  const completedChecklist = wedding.checklistItems.filter((i) => i.completedAt !== null).length;
  const checklistPct       = totalChecklist ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

  const totalVendors  = wedding.vendors.length;
  const bookedVendors = wedding.vendors.filter((v) => v.status === "booked").length;

  const nextEvent = wedding.events
    .filter((e) => new Date(e.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null;

  return {
    wedding,
    stats: {
      totalGuests,
      totalGroups,
      responded,
      responseRate: totalGroups ? Math.round((responded / totalGroups) * 100) : 0,
      daysUntilWedding,
      daysUntilDeadline,
      checklistPct,
      completedChecklist,
      totalChecklist,
      totalVendors,
      bookedVendors,
      nextEvent,
    },
  };
}

// ── Stat card icon paths ────────────────────────────────────────────────────

const ICON_GUESTS   = "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z";
const ICON_CHECK    = "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z";
const ICON_CLOCK    = "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z";
const ICON_CALENDAR = "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z";
const ICON_BUILDING = "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4";
const ICON_MAIL     = "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z";

function StatIcon({ path, color }: { path: string; color: string }) {
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-3 ${color}`}>
      <svg className="w-4.5 h-4.5 w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
      </svg>
    </div>
  );
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
    {
      label: "Total Guests",
      value: stats.totalGuests,
      sub: `in ${stats.totalGroups} groups`,
      iconPath: ICON_GUESTS,
      iconColor: "bg-blue-50 text-blue-600",
    },
    {
      label: "RSVPs Received",
      value: stats.responded,
      sub: `${stats.responseRate}% response rate`,
      iconPath: ICON_CHECK,
      iconColor: "bg-green-50 text-green-600",
    },
    {
      label: "Awaiting RSVP",
      value: stats.totalGroups - stats.responded,
      sub: "groups haven't responded",
      iconPath: ICON_MAIL,
      iconColor: "bg-amber-50 text-amber-600",
    },
    {
      label: stats.daysUntilWedding > 0 ? "Days Until Wedding" : "Wedding Day",
      value: stats.daysUntilWedding > 0 ? stats.daysUntilWedding : "Today! 🎉",
      sub: formatDate(wedding.weddingDate),
      iconPath: ICON_CLOCK,
      iconColor: "bg-accent-light text-accent",
    },
  ];

  const quickActions = [
    {
      label: "Add guests",
      description: "Build your guest list",
      href: "/dashboard/guests",
      iconPath: ICON_GUESTS,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Send invitations",
      description: "Email your RSVP invites",
      href: "/dashboard/invitations",
      iconPath: ICON_MAIL,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "View responses",
      description: "See who's coming",
      href: "/dashboard/responses",
      iconPath: ICON_CHECK,
      color: "bg-green-50 text-green-600",
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
            <div
              key={card.label}
              className="bg-white rounded-xl shadow-apple-sm border border-gray-100 p-6 flex flex-col"
            >
              <StatIcon path={card.iconPath} color={card.iconColor} />
              <div className="text-3xl font-semibold text-gray-900 tabular-nums tracking-tight leading-none mb-1.5">
                {card.value}
              </div>
              <div className="text-sm font-medium text-gray-700">{card.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Planning progress */}
        {stats.totalChecklist > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Planning progress</h2>
            <div className="bg-white rounded-xl border border-gray-100 shadow-apple-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Checklist completion</span>
                <span className="text-sm font-semibold text-gray-900">{stats.checklistPct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-700"
                  style={{ width: `${stats.checklistPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">
                {stats.completedChecklist} of {stats.totalChecklist} tasks complete
              </p>
            </div>

            {/* Vendor + next event snapshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {/* Vendor snapshot */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-apple-sm p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={ICON_BUILDING} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xl font-semibold text-gray-900 leading-tight">
                    {stats.bookedVendors}
                    <span className="text-sm font-normal text-gray-400 ml-1">/ {stats.totalVendors}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">Vendors booked</div>
                </div>
                <Link
                  href="/dashboard/vendors"
                  className="text-xs text-accent hover:underline shrink-0 font-medium"
                >
                  View →
                </Link>
              </div>

              {/* Next event */}
              {stats.nextEvent ? (
                <div className="bg-white rounded-xl border border-gray-100 shadow-apple-sm p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={ICON_CALENDAR} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{stats.nextEvent.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{formatDateTime(stats.nextEvent.date)}</div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-apple-sm p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={ICON_CALENDAR} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900">{formatDate(wedding.weddingDate)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Your wedding day</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="bg-white rounded-xl border border-gray-100 shadow-apple-sm p-5 flex flex-col gap-3 hover:shadow-apple-md transition-all duration-200 group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={action.iconPath} />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 group-hover:text-accent transition-colors">
                    {action.label}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{action.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Your public page */}
        <div className="bg-accent-light rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-accent">Your public wedding page</p>
            <p className="text-xs text-accent/70 mt-0.5">Share this link with your guests</p>
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
