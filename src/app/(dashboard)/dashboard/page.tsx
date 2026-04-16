import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { formatDate } from "@/lib/utils";
import {
  HeroBanner,
  PrimaryStatCard,
  JourneyCard,
  GradientProgressBar,
  BudgetBar,
  RsvpDeadlineAlert,
  QuickActionLink,
  buildJourneyCards,
  ICON_GUESTS,
  ICON_CHECK,
  ICON_CLOCK,
  ICON_BUDGET,
  ICON_MAIL,
  ICON_CHECKLIST,
  ICON_SEATING,
} from "./_components";

async function getWeddingStats(userId: string) {
  const wedding = await db.wedding.findFirst({
    where: { ownerId: userId },
    include: {
      guestGroups: {
        include: {
          guests: true,
          rsvpResponse: {
            include: { eventResponses: true },
          },
        },
      },
      events: { orderBy: { order: "asc" } },
      checklistItems: { select: { completedAt: true } },
      vendors: { select: { id: true, status: true } },
      // Budget
      budgetCategories: {
        include: {
          items: { select: { estimatedCost: true, amountPaid: true } },
        },
      },
      // Gifts / Thank-You
      gifts: { select: { value: true, thankYouStatus: true } },
      // Accommodations
      accommodations: { select: { roomsTotal: true, roomsBooked: true } },
      // Communications
      guestMessages: { select: { status: true } },
      // Wedding Party
      weddingParty: { select: { id: true } },
      // Seating
      seatingTables: {
        include: { assignments: { select: { guestId: true } } },
      },
      // Timeline
      timelineEvents: { select: { id: true } },
      // Music
      musicPlan: { select: { id: true, firstDanceSong: true } },
      // Ceremony
      ceremonyProgram: {
        include: { items: { select: { id: true } } },
      },
    },
  });

  if (!wedding) return null;

  // ── RSVP stats ──────────────────────────────────────────────────────────────
  const totalGroups = wedding.guestGroups.length;
  const totalGuests = wedding.guestGroups.reduce((sum, g) => sum + g.guests.length, 0);
  const responded   = wedding.guestGroups.filter((g) => g.rsvpResponse).length;

  const confirmedAttending = wedding.guestGroups.reduce((sum, g) => {
    if (!g.rsvpResponse) return sum;
    const attending = g.rsvpResponse.eventResponses.some((er) => er.attending);
    if (!attending) return sum;
    const primary = g.guests.filter((gu) => !gu.isPlusOne).length;
    const plusOne  = g.rsvpResponse.plusOneAttending ? 1 : 0;
    return sum + primary + plusOne;
  }, 0);

  // ── Date stats ──────────────────────────────────────────────────────────────
  const daysUntilWedding = Math.ceil(
    (new Date(wedding.weddingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const daysUntilDeadline = Math.ceil(
    (new Date(wedding.rsvpDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  // ── Checklist ───────────────────────────────────────────────────────────────
  const totalChecklist     = wedding.checklistItems.length;
  const completedChecklist = wedding.checklistItems.filter((i) => i.completedAt !== null).length;
  const checklistPct       = totalChecklist ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

  // ── Vendors ─────────────────────────────────────────────────────────────────
  const totalVendors  = wedding.vendors.length;
  const bookedVendors = wedding.vendors.filter((v) => v.status === "booked").length;

  // ── Budget ──────────────────────────────────────────────────────────────────
  const allBudgetItems = wedding.budgetCategories.flatMap((c) => c.items);
  const estimatedSpend = allBudgetItems.reduce((s, i) => s + i.estimatedCost, 0);
  const amountPaid     = allBudgetItems.reduce((s, i) => s + i.amountPaid, 0);
  const totalBudget    = wedding.totalBudget ?? 0;
  const budgetRemaining = totalBudget - estimatedSpend;
  const budgetUsedPct  = totalBudget > 0 ? Math.round((amountPaid / totalBudget) * 100) : 0;

  // ── Gifts / Thank-You ────────────────────────────────────────────────────────
  const totalGifts     = wedding.gifts.length;
  const thankYouSent   = wedding.gifts.filter((g) => g.thankYouStatus === "sent").length;
  const thankYouPending = totalGifts - thankYouSent;

  // ── Accommodations ───────────────────────────────────────────────────────────
  const hotelCount  = wedding.accommodations.length;

  // ── Communications ───────────────────────────────────────────────────────────
  const totalMessagesSent = wedding.guestMessages.filter((m) => m.status === "sent").length;

  // ── Wedding Party ─────────────────────────────────────────────────────────────
  const weddingPartyCount = wedding.weddingParty.length;

  // ── Seating ──────────────────────────────────────────────────────────────────
  const tableCount    = wedding.seatingTables.length;
  const assignedSeats = new Set(
    wedding.seatingTables.flatMap((t) => t.assignments.map((a) => a.guestId))
  ).size;

  // ── Music / Ceremony ──────────────────────────────────────────────────────────
  const musicConfigured   = !!(wedding.musicPlan?.firstDanceSong);
  const ceremonyItemCount = wedding.ceremonyProgram?.items.length ?? 0;
  const vowsStatus = {
    partner1: wedding.ceremonyProgram?.partner1VowsStatus ?? "not_started",
    partner2: wedding.ceremonyProgram?.partner2VowsStatus ?? "not_started",
  };

  return {
    wedding,
    stats: {
      totalGuests,
      totalGroups,
      responded,
      confirmedAttending,
      responseRate: totalGroups ? Math.round((responded / totalGroups) * 100) : 0,
      daysUntilWedding,
      daysUntilDeadline,
      // Checklist
      checklistPct,
      completedChecklist,
      totalChecklist,
      // Vendors
      totalVendors,
      bookedVendors,
      // Budget
      totalBudget,
      estimatedSpend,
      amountPaid,
      budgetRemaining,
      budgetUsedPct,
      // Gifts
      totalGifts,
      thankYouSent,
      thankYouPending,
      // Accommodations
      hotelCount,
      // Communications
      totalMessagesSent,
      // Wedding Party
      weddingPartyCount,
      // Seating
      tableCount,
      assignedSeats,
      // Music / Ceremony
      musicConfigured,
      ceremonyItemCount,
      vowsStatus,
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

  // ── Four primary stat cards ────────────────────────────────────────────────
  const primaryStatCards = [
    {
      label: "Attending",
      value: stats.confirmedAttending,
      sub: `of ${stats.totalGuests} invited guests`,
      iconPath: ICON_GUESTS,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-l-blue-400",
    },
    {
      label: "RSVP rate",
      value: `${stats.responseRate}%`,
      sub: `${stats.responded} of ${stats.totalGroups} groups responded`,
      iconPath: ICON_CHECK,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
      borderColor: "border-l-green-400",
    },
    {
      label: stats.totalBudget > 0 ? "Budget paid" : "Budget",
      value: stats.totalBudget > 0 ? `${stats.budgetUsedPct}%` : "—",
      sub: stats.totalBudget > 0
        ? `of total budget`
        : "No budget set yet",
      iconPath: ICON_BUDGET,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      borderColor: "border-l-amber-400",
    },
    {
      label: stats.daysUntilWedding > 0 ? "Days to go" : "Wedding day",
      value: stats.daysUntilWedding > 0 ? stats.daysUntilWedding : "Today!",
      sub: formatDate(wedding.weddingDate),
      iconPath: ICON_CLOCK,
      iconBg: "bg-accent-light",
      iconColor: "text-accent",
      borderColor: "border-l-accent",
    },
  ];

  // ── Six quick actions ──────────────────────────────────────────────────────
  const quickActions = [
    {
      label: "Add guests",
      description: "Build your guest list",
      href: "/dashboard/guests",
      iconPath: ICON_GUESTS,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Send invitations",
      description: "Email your RSVP invites",
      href: "/dashboard/invitations",
      iconPath: ICON_MAIL,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      label: "View responses",
      description: "See who's coming",
      href: "/dashboard/responses",
      iconPath: ICON_CHECK,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      label: "Manage budget",
      description: "Track your spending",
      href: "/dashboard/budget",
      iconPath: ICON_BUDGET,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Assign seating",
      description: "Arrange your tables",
      href: "/dashboard/seating",
      iconPath: ICON_SEATING,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      label: "View checklist",
      description: "Stay on top of tasks",
      href: "/dashboard/checklist",
      iconPath: ICON_CHECKLIST,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
    },
  ];

  const journeyCards = buildJourneyCards(stats);

  return (
    <DashboardShell>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* RSVP deadline alert */}
        <RsvpDeadlineAlert daysUntilDeadline={stats.daysUntilDeadline} />

        {/* Hero banner — couple names + countdown */}
        <HeroBanner
          partner1Name={wedding.partner1Name}
          partner2Name={wedding.partner2Name}
          weddingDate={wedding.weddingDate}
          venueName={wedding.venueName}
          daysUntilWedding={stats.daysUntilWedding}
          coverPhotoUrl={wedding.coverPhotoUrl}
        />

        {/* Four primary stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {primaryStatCards.map((card) => (
            <PrimaryStatCard key={card.label} {...card} />
          ))}
        </div>

        {/* "Your planning journey" — 10-card section health grid */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Your planning journey</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {journeyCards.map((card) => (
              <JourneyCard key={card.href} {...card} />
            ))}
          </div>
        </div>

        {/* Planning progress bar */}
        {stats.totalChecklist > 0 && (
          <GradientProgressBar
            pct={stats.checklistPct}
            completed={stats.completedChecklist}
            total={stats.totalChecklist}
          />
        )}

        {/* Budget snapshot */}
        {stats.totalBudget > 0 && (
          <BudgetBar
            totalBudget={stats.totalBudget}
            estimatedSpend={stats.estimatedSpend}
            amountPaid={stats.amountPaid}
          />
        )}

        {/* Quick actions — 6-up grid */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <QuickActionLink key={action.href} {...action} />
            ))}
          </div>
        </div>

        {/* Public wedding page link */}
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
