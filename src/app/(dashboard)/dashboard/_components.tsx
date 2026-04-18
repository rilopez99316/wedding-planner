import Link from "next/link";
import { formatDate, formatCurrency } from "@/lib/utils";

// ── Icon paths (Heroicons outline, 24×24) ─────────────────────────────────────

export const ICON_GUESTS    = "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z";
export const ICON_CHECK     = "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z";
export const ICON_CLOCK     = "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z";
export const ICON_MAIL      = "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z";
export const ICON_BUILDING  = "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4";
export const ICON_BUDGET    = "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
export const ICON_HEART     = "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z";
export const ICON_MUSIC     = "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3";
export const ICON_SEATING   = "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z";
export const ICON_CHECKLIST = "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4";
export const ICON_CEREMONY  = "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z";

// ── Shared SVG wrapper ────────────────────────────────────────────────────────

function Icon({ path, className = "w-[18px] h-[18px]" }: { path: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

// ── HeroBanner ────────────────────────────────────────────────────────────────

export function HeroBanner({
  partner1Name,
  partner2Name,
  weddingDate,
  venueName,
  daysUntilWedding,
  coverPhotoUrl,
}: {
  partner1Name: string;
  partner2Name: string;
  weddingDate: Date | string;
  venueName: string | null;
  daysUntilWedding: number;
  coverPhotoUrl?: string | null;
}) {
  const isToday = daysUntilWedding <= 0;

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-apple-lg" style={{ minHeight: "300px" }}>
      {/* Background — photo or romantic gradient fallback */}
      {coverPhotoUrl ? (
        <img
          src={coverPhotoUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, #1B2A4A 0%, #2a1f3d 50%, #0f1a2e 100%)" }}
        >
          {/* Subtle crosshatch texture — matches public wedding page fallback */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg,#fff 0,transparent 1px,transparent 8px),repeating-linear-gradient(-45deg,#fff 0,transparent 1px,transparent 8px)",
            }}
          />
        </div>
      )}

      {/* SVG grain / noise overlay — adds film-grain depth */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        style={{ opacity: 0.035 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* Directional vignette — lets the photo breathe in the center */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/30 to-black/65" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-8 py-16">
        {/* Pre-label */}
        <p className="text-[9px] tracking-[0.45em] uppercase text-white/70 font-sans mb-5 select-none">
          your wedding day
        </p>

        {/* Couple names — cinematic serif, matches public page aesthetic */}
        <h1
          className="font-serif font-light text-white leading-tight"
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            letterSpacing: "-0.01em",
            textShadow: "0 2px 24px rgba(0,0,0,0.35)",
          }}
        >
          {partner1Name} & {partner2Name}
        </h1>

        {/* Diamond separator — mirrors public wedding page */}
        <div className="flex items-center gap-3 my-5">
          <div className="w-12 h-px bg-white/25" />
          <span className="text-white/35 text-[8px] select-none">◆</span>
          <div className="w-12 h-px bg-white/25" />
        </div>

        {/* Date + venue */}
        <p className="text-[10px] tracking-[0.3em] uppercase text-white/85 font-sans mb-8">
          {formatDate(weddingDate)}
          {venueName ? <>&nbsp;&middot;&nbsp;{venueName}</> : null}
        </p>

        {/* Countdown — frosted glass card */}
        {isToday ? (
          <div className="backdrop-blur-md bg-white/15 border border-white/20 rounded-2xl px-10 py-5 shadow-apple-md" style={{ borderColor: "rgba(201,168,76,0.25)" }}>
            <div className="text-4xl font-light font-serif text-white leading-none">Today!</div>
            <div className="text-[9px] tracking-[0.3em] uppercase text-white/50 mt-2.5 font-sans">
              Your wedding day is here
            </div>
          </div>
        ) : (
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl px-12 py-6 shadow-apple-md" style={{ borderColor: "rgba(201,168,76,0.25)" }}>
            <div
              className="text-7xl font-semibold tabular-nums text-white leading-none"
              style={{ textShadow: "0 2px 16px rgba(0,0,0,0.25)" }}
            >
              {daysUntilWedding}
            </div>
            <div className="text-[9px] tracking-[0.35em] uppercase text-white/50 mt-2.5 font-sans">
              days to go
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PrimaryStatCard ───────────────────────────────────────────────────────────

export function PrimaryStatCard({
  label,
  value,
  sub,
  iconPath,
  iconBg,
  iconColor,
  borderColor,
}: {
  label: string;
  value: string | number;
  sub: string;
  iconPath: string;
  iconBg: string;
  iconColor: string;
  borderColor: string;
}) {
  return (
    <div className={`bg-[#FDFCFB] rounded-xl shadow-apple-sm border border-gray-100 border-t-2 ${borderColor} p-7 flex flex-col`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-5 ${iconBg} ${iconColor}`}>
        <Icon path={iconPath} />
      </div>
      <div className="font-serif text-4xl font-light text-gray-900 tabular-nums tracking-tight leading-none mb-2">
        {value}
      </div>
      <div className="text-sm font-semibold text-gray-700">{label}</div>
      <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
    </div>
  );
}

// ── JourneyCard ───────────────────────────────────────────────────────────────

export type JourneyStatus = "on-track" | "in-progress" | "not-started";

const STATUS_CONFIG: Record<JourneyStatus, { label: string; className: string }> = {
  "on-track":    { label: "On track",    className: "bg-green-50 text-green-700" },
  "in-progress": { label: "In progress", className: "bg-amber-50 text-amber-700" },
  "not-started": { label: "Not started", className: "bg-gray-100 text-gray-500"  },
};

export function JourneyCard({
  label,
  stat,
  status,
  href,
  iconPath,
  iconBg,
  iconColor,
}: {
  label: string;
  stat: string;
  status: JourneyStatus;
  href: string;
  iconPath: string;
  iconBg: string;
  iconColor: string;
}) {
  const s = STATUS_CONFIG[status];

  return (
    <Link
      href={href}
      className="group bg-white rounded-xl border border-gray-100 shadow-apple-sm p-4 flex flex-col gap-3 hover:shadow-apple-md hover:border-accent/20 hover:bg-[#FDFCFB] transition-all duration-200"
    >
      {/* Icon + arrow */}
      <div className="relative flex items-start">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg} ${iconColor}`}>
          <Icon path={iconPath} className="w-4 h-4" />
        </div>
        <span className="absolute top-0 right-0 text-base text-gray-200 group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-200 leading-none">
          →
        </span>
      </div>

      {/* Headline stat */}
      <div className="font-serif text-2xl font-light text-gray-900 leading-tight">{stat}</div>

      {/* Label + status badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-500 truncate">{label}</span>
        <span className={`shrink-0 text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${s.className}`}>
          {s.label}
        </span>
      </div>
    </Link>
  );
}

// ── GradientProgressBar ───────────────────────────────────────────────────────

export function GradientProgressBar({
  pct,
  completed,
  total,
}: {
  pct: number;
  completed: number;
  total: number;
}) {
  const milestones = [25, 50, 75, 100];

  return (
    <div className="bg-[#FDFCFB] rounded-xl border border-gray-100 shadow-apple-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-serif text-base font-light text-gray-900">Planning progress</span>
        <span className="text-sm font-semibold text-accent">{pct}%</span>
      </div>

      {/* Milestone dots row — above the bar */}
      <div className="relative h-2">
        {milestones.map((m) => (
          <div
            key={m}
            className="absolute top-0 -translate-x-1/2"
            style={{ left: `${m}%` }}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${pct >= m ? "bg-accent" : "bg-gray-200"}`}
              style={pct >= m ? { boxShadow: "0 0 4px rgba(0,113,227,0.4)" } : undefined}
            />
          </div>
        ))}
      </div>

      {/* Bar */}
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-hover transition-all duration-700"
          style={{ width: `${pct}%`, boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3)" }}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {completed} of {total} tasks complete
        </p>
        {pct >= 100 && (
          <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            All done!
          </span>
        )}
        {pct >= 75 && pct < 100 && (
          <span className="text-xs font-semibold text-accent bg-accent-light px-2 py-0.5 rounded-full">
            Almost there
          </span>
        )}
        {pct >= 50 && pct < 75 && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
            Halfway there
          </span>
        )}
      </div>
    </div>
  );
}

// ── BudgetBar ─────────────────────────────────────────────────────────────────

export function BudgetBar({
  totalBudget,
  estimatedSpend,
  amountPaid,
}: {
  totalBudget: number;
  estimatedSpend: number;
  amountPaid: number;
}) {
  const estimatedPct = totalBudget > 0 ? Math.min(100, Math.round((estimatedSpend / totalBudget) * 100)) : 0;
  const paidPct      = totalBudget > 0 ? Math.min(100, Math.round((amountPaid / totalBudget) * 100)) : 0;
  const isOverBudget = estimatedSpend > totalBudget;

  return (
    <div className="bg-[#FDFCFB] rounded-xl border border-gray-100 shadow-apple-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-serif text-base font-light text-gray-900">Budget snapshot</span>
        <Link href="/dashboard/budget" className="text-xs text-accent hover:underline font-medium">
          Manage →
        </Link>
      </div>

      {/* Two-layer bar: estimated (light) behind paid (solid) */}
      <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${isOverBudget ? "bg-red-200" : "bg-accent/25"}`}
          style={{ width: `${estimatedPct}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent transition-all duration-700"
          style={{ width: `${paidPct}%`, boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3)" }}
        />
      </div>

      {/* Three stat columns */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="font-serif text-base font-light text-gray-900">{formatCurrency(amountPaid)}</div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-xs text-gray-400">Paid</span>
          </div>
        </div>
        <div>
          <div className="font-serif text-base font-light text-gray-900">{formatCurrency(estimatedSpend)}</div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <div className="w-2 h-2 rounded-full bg-accent/30" />
            <span className="text-xs text-gray-400">Estimated</span>
          </div>
        </div>
        <div>
          <div className={`font-serif text-base font-light ${isOverBudget ? "text-red-600" : "text-gray-900"}`}>
            {formatCurrency(totalBudget)}
          </div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <div className="w-2 h-2 rounded-full bg-gray-300" />
            <span className="text-xs text-gray-400">Total budget</span>
          </div>
        </div>
      </div>

      {isOverBudget && (
        <div className="flex items-center justify-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <span className="text-xs text-red-600 font-medium">
            Estimated spend exceeds budget by{" "}
            <strong className="font-semibold">{formatCurrency(estimatedSpend - totalBudget)}</strong>
          </span>
        </div>
      )}
    </div>
  );
}

// ── RsvpDeadlineAlert ─────────────────────────────────────────────────────────

export function RsvpDeadlineAlert({ daysUntilDeadline }: { daysUntilDeadline: number }) {
  if (daysUntilDeadline <= 0 || daysUntilDeadline > 14) return null;

  const isUrgent = daysUntilDeadline <= 3;
  const ICON_WARNING = "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z";

  return (
    <div className={`rounded-xl px-5 py-4 flex items-center gap-4 border ${
      isUrgent ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
    }`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
        isUrgent ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
      }`}>
        <Icon path={ICON_WARNING} className="w-[18px] h-[18px]" />
      </div>
      <p className={`text-sm font-medium ${isUrgent ? "text-red-800" : "text-amber-800"}`}>
        RSVP deadline is{" "}
        <strong>
          {daysUntilDeadline === 1 ? "tomorrow" : `in ${daysUntilDeadline} days`}
        </strong>{" "}
        —{" "}
        <Link href="/dashboard/invitations" className="underline underline-offset-2 hover:no-underline">
          send reminders
        </Link>{" "}
        to guests who haven&apos;t responded.
      </p>
    </div>
  );
}

// ── QuickActionLink ───────────────────────────────────────────────────────────

export function QuickActionLink({
  label,
  description,
  href,
  iconPath,
  iconBg,
  iconColor,
}: {
  label: string;
  description: string;
  href: string;
  iconPath: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Link
      href={href}
      className="group relative bg-[#FDFCFB] rounded-xl border border-gray-100 shadow-apple-sm overflow-hidden flex items-center gap-4 p-4 hover:shadow-apple-md hover:border-accent/20 hover:bg-white transition-all duration-200"
    >
      {/* Left gold gradient strip */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 opacity-60 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: "linear-gradient(to bottom, rgba(201,168,76,0.6), rgba(201,168,76,0.15))" }}
      />
      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${iconBg} ${iconColor}`}>
        <Icon path={iconPath} className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-gray-900 group-hover:text-accent transition-colors">
          {label}
        </div>
        <div className="text-xs text-gray-400 mt-0.5 truncate">{description}</div>
      </div>
      <span className="shrink-0 text-sm text-gray-200 group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-200">
        →
      </span>
    </Link>
  );
}

// ── buildJourneyCards ─────────────────────────────────────────────────────────

export interface JourneyCardDef {
  label: string;
  stat: string;
  status: JourneyStatus;
  href: string;
  iconPath: string;
  iconBg: string;
  iconColor: string;
}

export function buildJourneyCards(stats: {
  checklistPct: number;
  totalChecklist: number;
  completedChecklist: number;
  bookedVendors: number;
  totalVendors: number;
  totalBudget: number;
  estimatedSpend: number;
  budgetRemaining: number;
  tableCount: number;
  assignedSeats: number;
  confirmedAttending: number;
  hotelCount: number;
  totalGifts: number;
  thankYouSent: number;
  thankYouPending: number;
  totalMessagesSent: number;
  weddingPartyCount: number;
  musicConfigured: boolean;
  ceremonyItemCount: number;
  vowsStatus: { partner1: string; partner2: string };
}): JourneyCardDef[] {
  return [
    {
      label: "Checklist",
      stat: stats.totalChecklist === 0 ? "No tasks yet" : `${stats.checklistPct}% done`,
      status: stats.totalChecklist === 0
        ? "not-started"
        : stats.checklistPct === 100
        ? "on-track"
        : "in-progress",
      href: "/dashboard/checklist",
      iconPath: ICON_CHECKLIST,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
    },
    {
      label: "Vendors",
      stat: stats.totalVendors === 0 ? "None added" : `${stats.bookedVendors} / ${stats.totalVendors} booked`,
      status: stats.totalVendors === 0
        ? "not-started"
        : stats.bookedVendors === stats.totalVendors
        ? "on-track"
        : "in-progress",
      href: "/dashboard/vendors",
      iconPath: ICON_BUILDING,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      label: "Budget",
      stat: stats.totalBudget === 0
        ? "Not set"
        : stats.budgetRemaining >= 0
        ? `${formatCurrency(stats.budgetRemaining)} left`
        : `${formatCurrency(Math.abs(stats.budgetRemaining))} over`,
      status: stats.totalBudget === 0
        ? "not-started"
        : stats.estimatedSpend <= stats.totalBudget
        ? "on-track"
        : "in-progress",
      href: "/dashboard/budget",
      iconPath: ICON_BUDGET,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Seating",
      stat: stats.tableCount === 0 ? "No tables" : `${stats.assignedSeats} seated`,
      status: stats.tableCount === 0
        ? "not-started"
        : stats.confirmedAttending === 0
        ? "not-started"
        : stats.assignedSeats >= stats.confirmedAttending
        ? "on-track"
        : "in-progress",
      href: "/dashboard/seating",
      iconPath: ICON_SEATING,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      label: "Accommodations",
      stat: stats.hotelCount === 0 ? "None added" : `${stats.hotelCount} hotel${stats.hotelCount !== 1 ? "s" : ""}`,
      status: stats.hotelCount === 0 ? "not-started" : "on-track",
      href: "/dashboard/accommodations",
      iconPath: ICON_BUILDING,
      iconBg: "bg-sky-50",
      iconColor: "text-sky-600",
    },
    {
      label: "Thank-Yous",
      stat: stats.totalGifts === 0 ? "No gifts yet" : `${stats.thankYouSent} / ${stats.totalGifts} sent`,
      status: stats.totalGifts === 0
        ? "not-started"
        : stats.thankYouPending === 0
        ? "on-track"
        : "in-progress",
      href: "/dashboard/thank-you",
      iconPath: ICON_HEART,
      iconBg: "bg-pink-50",
      iconColor: "text-pink-600",
    },
    {
      label: "Communications",
      stat: stats.totalMessagesSent === 0 ? "None sent" : `${stats.totalMessagesSent} sent`,
      status: stats.totalMessagesSent === 0 ? "not-started" : "on-track",
      href: "/dashboard/communications",
      iconPath: ICON_MAIL,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      label: "Wedding Party",
      stat: stats.weddingPartyCount === 0 ? "None added" : `${stats.weddingPartyCount} member${stats.weddingPartyCount !== 1 ? "s" : ""}`,
      status: stats.weddingPartyCount === 0 ? "not-started" : "on-track",
      href: "/dashboard/wedding-party",
      iconPath: ICON_HEART,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-500",
    },
    {
      label: "Music",
      stat: stats.musicConfigured ? "First dance set" : "Not started",
      status: stats.musicConfigured ? "on-track" : "not-started",
      href: "/dashboard/music",
      iconPath: ICON_MUSIC,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      label: "Ceremony",
      stat: stats.ceremonyItemCount === 0 ? "No program yet" : `${stats.ceremonyItemCount} program items`,
      status: stats.ceremonyItemCount === 0
        ? "not-started"
        : stats.vowsStatus.partner1 === "done" && stats.vowsStatus.partner2 === "done"
        ? "on-track"
        : "in-progress",
      href: "/dashboard/ceremony",
      iconPath: ICON_CEREMONY,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
    },
  ];
}
