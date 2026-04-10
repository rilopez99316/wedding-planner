import Link from "next/link";
import FadeIn from "@/components/ui/FadeIn";

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

export default function MarketingPage() {
  return (
    <div className="pt-14">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        {/* Subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent-light/40 via-white to-white pointer-events-none" />

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
              style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)" }}
            >
              Your wedding,
              <br />
              <span className="text-accent">beautifully planned.</span>
            </h1>
          </FadeIn>

          <FadeIn direction="up" delay={0.1}>
            <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed mb-10">
              From your first guest list to the last thank-you note — Vows keeps every part of your wedding journey organized, beautiful, and stress-free.
            </p>
          </FadeIn>

          <FadeIn direction="up" delay={0.15}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-md bg-accent text-white font-medium text-[16px] hover:brightness-105 shadow-apple-md transition-all duration-150"
              >
                Start planning — it&apos;s free
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-md bg-gray-100 text-gray-900 font-medium text-[16px] hover:bg-gray-200 transition-all duration-150"
              >
                Sign in
              </Link>
            </div>
          </FadeIn>
        </div>

        {/* Floating preview card */}
        <FadeIn direction="up" delay={0.25} className="relative mt-16 w-full max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-apple-xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-2 text-xs text-gray-400">vows.app/dashboard</span>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Guests", value: "142" },
                { label: "RSVPs Received", value: "89" },
                { label: "Response Rate", value: "63%" },
                { label: "Days Until Wedding", value: "47" },
              ].map((stat) => (
                <div key={stat.label} className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Features */}
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
                <div className="bg-gray-50 rounded-xl p-6 hover:bg-white hover:shadow-apple-md transition-all duration-200 border border-transparent hover:border-gray-100">
                  <div className="text-2xl mb-3">{feature.icon}</div>
                  <h3 className="font-semibold text-gray-900 text-[15px] mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 bg-gray-50">
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
                <div className="bg-white rounded-xl p-6 shadow-apple-sm border border-gray-100">
                  <div className="text-3xl font-light text-accent/40 mb-4 tabular-nums">{step.number}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-white">
        <FadeIn direction="up" className="max-w-2xl mx-auto text-center">
          <h2
            className="font-sans font-light text-gray-900 tracking-tight mb-4"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.03em" }}
          >
            Ready to start planning?
          </h2>
          <p className="text-gray-500 text-lg mb-8">
            Create your free account today and send your first RSVP invitations.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-4 rounded-md bg-accent text-white font-medium text-[16px] hover:brightness-105 shadow-apple-md transition-all duration-150"
          >
            Get started free
          </Link>
        </FadeIn>
      </section>
    </div>
  );
}
