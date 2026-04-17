import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import FadeIn from "@/components/ui/FadeIn";
import Divider from "@/components/ui/Divider";
import { formatDate, formatTime } from "@/lib/utils";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];

function BotanicalOrnament({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 140 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <line x1="70" y1="54" x2="70" y2="4" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M70 42 Q52 33 46 20" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      <path d="M70 30 Q55 21 51 10" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      <path d="M70 18 Q61 12 59 4" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      <ellipse cx="44" cy="18" rx="6" ry="2.5" transform="rotate(-35 44 18)" stroke="currentColor" strokeWidth="0.7" fill="none" />
      <ellipse cx="49" cy="8" rx="5" ry="2" transform="rotate(-50 49 8)" stroke="currentColor" strokeWidth="0.7" fill="none" />
      <ellipse cx="57" cy="2" rx="3.5" ry="1.5" transform="rotate(-65 57 2)" stroke="currentColor" strokeWidth="0.7" fill="none" />
      <path d="M70 42 Q88 33 94 20" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      <path d="M70 30 Q85 21 89 10" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      <path d="M70 18 Q79 12 81 4" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      <ellipse cx="96" cy="18" rx="6" ry="2.5" transform="rotate(35 96 18)" stroke="currentColor" strokeWidth="0.7" fill="none" />
      <ellipse cx="91" cy="8" rx="5" ry="2" transform="rotate(50 91 8)" stroke="currentColor" strokeWidth="0.7" fill="none" />
      <ellipse cx="83" cy="2" rx="3.5" ry="1.5" transform="rotate(65 83 2)" stroke="currentColor" strokeWidth="0.7" fill="none" />
      <path d="M70 54 Q59 47 55 43" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" fill="none" />
      <path d="M70 54 Q81 47 85 43" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const wedding = await db.wedding.findUnique({ where: { slug: params.slug } });
  if (!wedding) return {};
  return {
    title: `Schedule — ${wedding.partner1Name} & ${wedding.partner2Name}`,
  };
}

export default async function SchedulePage({ params }: { params: { slug: string } }) {
  const wedding = await db.wedding.findUnique({
    where: { slug: params.slug },
    include: { events: { orderBy: { order: "asc" } } },
  });

  if (!wedding) notFound();

  const { partner1Name, partner2Name, events } = wedding;

  return (
    <div className="min-h-screen bg-ivory">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden pt-36 pb-28 flex flex-col items-center text-center"
        style={{ background: "linear-gradient(160deg, rgb(var(--w-hero-start)) 0%, rgb(var(--w-hero-mid)) 60%, rgb(var(--w-hero-mid)) 100%)" }}
      >
        {/* Ghost background text */}
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden font-serif font-light text-white"
          style={{ fontSize: "clamp(5rem, 22vw, 16rem)", opacity: 0.033, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}
        >
          Schedule
        </span>

        {/* Diamond texture overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.028,
            backgroundImage:
              "repeating-linear-gradient(45deg, #fff 0px, transparent 1px, transparent 8px), repeating-linear-gradient(-45deg, #fff 0px, transparent 1px, transparent 8px)",
          }}
        />

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center px-6">
          <FadeIn direction="up" delay={0}>
            <p className="text-[10px] tracking-[0.45em] uppercase text-white/45 font-sans mb-8">
              {partner1Name} &amp; {partner2Name}
            </p>
          </FadeIn>

          <FadeIn direction="up" delay={0.1}>
            <BotanicalOrnament className="w-28 text-gold/50 mb-7" />
          </FadeIn>

          <FadeIn direction="up" delay={0.18}>
            <h1
              className="font-serif font-light text-white"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)", letterSpacing: "-0.02em" }}
            >
              Schedule of Events
            </h1>
          </FadeIn>

          <FadeIn direction="up" delay={0.26}>
            <div className="flex items-center gap-5 mt-9">
              <div className="w-20 h-px bg-white/15" />
              <span className="text-white/20 text-[10px]">◆</span>
              <div className="w-20 h-px bg-white/15" />
            </div>
          </FadeIn>
        </div>

        {/* Fade into page background */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, rgb(var(--w-ivory)))" }}
        />
      </section>

      {/* ── Timeline ─────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        {events.length === 0 ? (
          <FadeIn direction="up">
            <div className="text-center py-24">
              <BotanicalOrnament className="w-24 text-gold/25 mx-auto mb-8" />
              <p className="font-serif text-2xl font-light text-navy/35">
                Schedule details coming soon
              </p>
            </div>
          </FadeIn>
        ) : (
          <div className="relative">

            {/* Desktop centre vertical thread */}
            <div
              aria-hidden="true"
              className="hidden md:block absolute left-1/2 -translate-x-1/2 top-8 bottom-8 w-px pointer-events-none"
              style={{
                background:
                  "linear-gradient(to bottom, transparent 0%, rgb(var(--w-gold) / 0.25) 8%, rgb(var(--w-gold) / 0.25) 92%, transparent 100%)",
              }}
            />

            {/* Mobile left vertical thread */}
            <div
              aria-hidden="true"
              className="md:hidden absolute left-[7px] top-8 bottom-8 w-px bg-gold/20"
            />

            <div className="space-y-1">
              {events.map((event, i) => {
                const isOdd = i % 2 === 1;
                const roman = ROMAN[i] ?? String(i + 1);

                return (
                  <FadeIn
                    key={event.id}
                    direction={isOdd ? "right" : "left"}
                    delay={i * 0.09}
                  >
                    {/* Outer flex row — col on mobile, alternating row on desktop */}
                    <div
                      className={[
                        "relative flex py-8",
                        /* mobile */
                        "flex-col pl-8",
                        /* desktop */
                        "md:pl-0 md:flex-row md:items-center",
                        isOdd ? "md:flex-row-reverse" : "",
                      ].join(" ")}
                    >
                      {/* Mobile timeline dot */}
                      <div
                        className="md:hidden absolute left-0 top-10 w-3.5 h-3.5 rounded-full bg-ivory border-2 border-gold"
                        style={{ boxShadow: "0 0 0 5px rgb(var(--w-gold) / 0.1)" }}
                      />

                      {/* Event card */}
                      <article
                        className={[
                          "relative w-full overflow-hidden rounded-2xl",
                          "bg-ivory/65 backdrop-blur-sm border border-gold/10",
                          "px-7 py-8",
                          "transition-all duration-300",
                          "hover:border-gold/30 hover:shadow-apple-md hover:bg-ivory/85",
                          "md:w-[calc(50%-2.75rem)]",
                        ].join(" ")}
                      >
                        {/* Ghost roman numeral */}
                        <span
                          aria-hidden="true"
                          className="absolute -top-2 right-4 font-serif font-light text-navy pointer-events-none select-none leading-none"
                          style={{ fontSize: "5.5rem", opacity: 0.042 }}
                        >
                          {roman}
                        </span>

                        {/* Time badge */}
                        <span className="inline-block border border-gold/40 text-gold text-[10px] tracking-[0.28em] uppercase px-4 py-1 rounded-full font-sans mb-5">
                          {formatTime(event.date)}
                        </span>

                        <h2
                          className="font-serif font-light text-navy mb-3"
                          style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}
                        >
                          {event.label}
                        </h2>

                        <div className="w-8 h-px bg-gold/35 mb-3" />

                        <p className="text-[11px] text-navy/35 font-sans tracking-wide mb-2">
                          {formatDate(event.date)}
                        </p>

                        {event.location && (
                          <p className="text-sm text-navy/60 font-sans leading-relaxed">
                            {event.location}
                          </p>
                        )}

                        {event.notes && (
                          <p className="text-sm text-navy/35 font-sans leading-relaxed italic mt-2">
                            {event.notes}
                          </p>
                        )}
                      </article>

                      {/* Desktop centre dot */}
                      <div className="hidden md:flex w-[5.5rem] shrink-0 items-center justify-center z-10">
                        <div
                          className="w-4 h-4 rounded-full bg-ivory border-2 border-gold"
                          style={{ boxShadow: "0 0 0 5px rgb(var(--w-gold) / 0.1)" }}
                        />
                      </div>

                      {/* Desktop spacer (opposite half) */}
                      <div className="hidden md:block md:w-[calc(50%-2.75rem)] shrink-0" />
                    </div>
                  </FadeIn>
                );
              })}
            </div>

            <FadeIn direction="up" delay={0.2}>
              <div className="mt-16 flex flex-col items-center gap-8">
                <BotanicalOrnament className="w-24 text-gold/25" />
                <Divider diamond />
              </div>
            </FadeIn>
          </div>
        )}
      </div>
    </div>
  );
}
