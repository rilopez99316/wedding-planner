import Link from "next/link";
import FadeIn from "@/components/ui/FadeIn";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: "✉️",
    title: "RSVP Invitations",
    description: "Send beautiful personalized email invitations. Guests click their unique link and RSVP in minutes.",
  },
  {
    icon: "👥",
    title: "Guest Management",
    description: "Organize guests into families and groups. Track A-list and B-list, dietary restrictions, and event attendance.",
  },
  {
    icon: "✅",
    title: "Planning Checklist",
    description: "A curated 12-month timeline keeps you on track from engagement to the big day. Add your own tasks too.",
  },
  {
    icon: "💰",
    title: "Budget Tracker",
    description: "Set your total budget, track actual vs. estimated by category, and never miss a vendor payment.",
  },
  {
    icon: "📋",
    title: "Vendor Manager",
    description: "Keep all your vendor contacts, contracts, and payment schedules in one organized place.",
  },
  {
    icon: "🪑",
    title: "Seating Chart",
    description: "Drag-and-drop table assignments, auto-populated from your RSVP responses.",
  },
  {
    icon: "🕐",
    title: "Day-Of Timeline",
    description: "Build a minute-by-minute schedule and share it with your vendors and wedding party.",
  },
  {
    icon: "🎁",
    title: "Registry & Gifts",
    description: "Link your registries, track gifts received, and never miss sending a thank-you note.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your account",
    description: "Sign up and tell us about your wedding — couple names, date, and venue. Takes under a minute.",
  },
  {
    number: "02",
    title: "Add your guests",
    description: "Build your guest list with names and email addresses. Organize into families and groups.",
  },
  {
    number: "03",
    title: "Send invitations",
    description: "Click send. Each guest gets a personalized email with their unique RSVP link.",
  },
  {
    number: "04",
    title: "Track everything",
    description: "Watch RSVPs come in. See who's attending, dietary needs, and plan from there.",
  },
];

const vendorMockItems = [
  { name: "The Grand Ballroom", cat: "Venue", status: "Booked", color: "bg-green-50 text-green-700" },
  { name: "Aria Photography", cat: "Photographer", status: "Shortlisted", color: "bg-amber-50 text-amber-700" },
  { name: "Bloom & Co.", cat: "Florist", status: "Prospect", color: "bg-gray-100 text-gray-600" },
  { name: "Harmony Catering", cat: "Caterer", status: "Shortlisted", color: "bg-amber-50 text-amber-700" },
];

export default function MarketingPage() {
  return (
    <div className="pt-14">
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[95vh] flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        {/* Layered background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-5%,rgba(0,113,227,0.10),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/0 to-white pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <FadeIn direction="up" delay={0}>
            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-xs font-medium text-gray-600 shadow-apple-xs mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Now open for all couples
            </div>
          </FadeIn>

          <FadeIn direction="up" delay={0.05}>
            <h1
              className="font-sans font-light text-gray-900 leading-[1.05] tracking-[-0.04em] mb-6"
              style={{ fontSize: "clamp(3.5rem, 8vw, 6.5rem)" }}
            >
              Your wedding,
              <br />
              <span className="bg-gradient-to-r from-accent to-blue-500 bg-clip-text text-transparent">
                beautifully planned.
              </span>
            </h1>
          </FadeIn>

          <FadeIn direction="up" delay={0.1}>
            <p className="text-xl text-gray-600 max-w-xl mx-auto leading-relaxed mb-10">
              From your first guest list to the last thank-you note — Vows keeps every part of your wedding journey organized, beautiful, and stress-free.
            </p>
          </FadeIn>

          <FadeIn direction="up" delay={0.15}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 rounded-md bg-accent text-white font-medium text-[16px] hover:brightness-105 shadow-apple-lg transition-all duration-150"
              >
                Start planning — it&apos;s free
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 rounded-md bg-gray-100 text-gray-900 font-medium text-[16px] hover:bg-gray-200 transition-all duration-150"
              >
                Sign in
              </Link>
            </div>
          </FadeIn>

          {/* Social proof */}
          <FadeIn direction="up" delay={0.2}>
            <div className="flex items-center justify-center gap-3 mt-8">
              <div className="flex -space-x-1.5">
                {["#E8F1FB", "#FDF0E0", "#F0FDF4", "#FEF9C3", "#FDF2F8"].map((bg, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full ring-2 ring-white"
                    style={{ background: bg }}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-700">2,000+</span> couples planning their perfect day
              </p>
            </div>
          </FadeIn>
        </div>

        {/* Floating preview */}
        <FadeIn
          direction="up"
          delay={0.3}
          className="relative mt-16 w-full max-w-3xl mx-auto"
        >
          <div className="bg-white rounded-2xl shadow-apple-xl border border-gray-100 overflow-hidden pointer-events-none select-none">
            {/* Browser chrome */}
            <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-2 text-xs text-gray-400">vows.app/dashboard</span>
            </div>
            {/* Mock UI */}
            <div className="grid grid-cols-[56px_1fr]">
              {/* Mini sidebar */}
              <div className="bg-gray-50 border-r border-gray-100 p-2 space-y-1.5 min-h-[200px]">
                {[true, false, false, false, false, false].map((active, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-5 rounded",
                      active ? "bg-accent-light" : "bg-gray-200"
                    )}
                  />
                ))}
              </div>
              {/* Main content */}
              <div className="p-5 space-y-4">
                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Guests", value: "142" },
                    { label: "RSVPs", value: "89" },
                    { label: "Rate", value: "63%" },
                    { label: "Days", value: "47" },
                  ].map((s) => (
                    <div key={s.label} className="bg-gray-50 rounded-lg p-2.5 text-center">
                      <div className="text-sm font-semibold text-gray-900">{s.value}</div>
                      <div className="text-[9px] text-gray-400 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[9px] text-gray-400 mb-1">
                    <span>Planning progress</span>
                    <span>68%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full w-[68%] bg-accent rounded-full" />
                  </div>
                </div>
                {/* Quick actions */}
                <div className="grid grid-cols-3 gap-2">
                  {["Add Guests", "Invitations", "Responses"].map((label) => (
                    <div key={label} className="bg-accent-light/60 rounded-lg p-2">
                      <div className="text-[9px] font-medium text-accent truncate">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn direction="up" className="text-center mb-16">
            <h2
              className="font-sans font-light text-gray-900 tracking-tight mb-4"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.03em" }}
            >
              Everything you need,
              <br />
              nothing you don&apos;t.
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Each feature is purpose-built for the wedding planning journey — starting with RSVP and growing with you.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, i) => (
              <FadeIn key={feature.title} direction="up" delay={i * 0.04}>
                <div className="bg-gray-50 rounded-xl p-6 border border-transparent hover:border-gray-200 hover:bg-white hover:shadow-apple-md transition-all duration-200">
                  <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center mb-4 text-lg">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-[15px] mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Built for couples ────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: vendor manager mock */}
          <FadeIn direction="right">
            <div className="bg-white rounded-2xl shadow-apple-xl border border-gray-100 overflow-hidden pointer-events-none select-none">
              <div className="bg-gray-50 border-b border-gray-100 px-4 py-2.5 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <span className="ml-2 text-[10px] text-gray-400">Vendors</span>
              </div>
              <div className="p-5 grid grid-cols-2 gap-3">
                {vendorMockItems.map((v) => (
                  <div key={v.name} className="bg-white rounded-xl border border-gray-100 shadow-apple-xs p-3">
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <span className="text-[11px] font-semibold text-gray-900 leading-tight">{v.name}</span>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0", v.color)}>
                        {v.status}
                      </span>
                    </div>
                    <span className="text-[9px] text-gray-400">{v.cat}</span>
                    <div className="mt-2 h-1 bg-gray-100 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Right: copy */}
          <FadeIn direction="left" delay={0.1}>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">Built for couples</p>
            <h2
              className="font-sans font-light text-gray-900 tracking-tight mb-6"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.03em" }}
            >
              Every vendor.<br />
              Every detail.<br />
              One place.
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-6">
              Track proposals, compare packages, and store contracts for every vendor — from your venue to your florist. No more inbox archaeology.
            </p>
            <ul className="space-y-3">
              {[
                "Compare up to 4 vendors side by side",
                "Track status: Prospect → Shortlisted → Booked",
                "Attach contracts and quotes directly to vendor records",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <FadeIn direction="up" className="text-center mb-16">
            <h2
              className="font-sans font-light text-gray-900 tracking-tight mb-4"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.03em" }}
            >
              Up and running in minutes.
            </h2>
            <p className="text-gray-500 text-lg">
              No complicated setup. Just your wedding, organized.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {steps.map((step, i) => (
              <FadeIn key={step.number} direction="up" delay={i * 0.08}>
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <div className="text-3xl font-light text-accent/40 mb-4 tabular-nums">{step.number}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-gradient-to-br from-accent to-blue-700 relative overflow-hidden">
        {/* Decorative glow */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle at 80% 50%, white 0%, transparent 60%)" }}
        />
        <FadeIn direction="up" className="max-w-2xl mx-auto text-center relative">
          <h2
            className="font-sans font-light text-white tracking-tight mb-4"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.03em" }}
          >
            Ready to start planning?
          </h2>
          <p className="text-white/70 text-lg mb-8">
            Create your free account today and send your first RSVP invitations.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-4 rounded-md bg-white text-accent font-medium text-[16px] hover:brightness-[0.97] shadow-apple-lg transition-all duration-150"
          >
            Get started free
          </Link>
        </FadeIn>
      </section>
    </div>
  );
}
