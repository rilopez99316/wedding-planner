import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import FadeIn from "@/components/ui/FadeIn";
import Divider from "@/components/ui/Divider";
import DeadlineCountdown from "@/components/rsvp/DeadlineCountdown";
import { formatTime } from "@/lib/utils";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const wedding = await db.wedding.findUnique({ where: { slug: params.slug } });
  if (!wedding) return {};
  return {
    title: `${wedding.partner1Name} & ${wedding.partner2Name}`,
    description: `You're invited to celebrate the wedding of ${wedding.partner1Name} & ${wedding.partner2Name}${wedding.venueName ? ` at ${wedding.venueName}` : ""}.`,
  };
}

export default async function WeddingHomePage({ params }: { params: { slug: string } }) {
  const wedding = await db.wedding.findUnique({
    where: { slug: params.slug },
    include: { events: { orderBy: { order: "asc" } } },
  });

  if (!wedding) notFound();

  const { partner1Name, partner2Name, weddingDate, venueName, venueAddress, rsvpDeadline, events, slug } = wedding;

  const weddingDateFormatted = new Date(weddingDate).toLocaleDateString("en-US", {
    weekday: "long",
    year:    "numeric",
    month:   "long",
    day:     "numeric",
  });

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 text-center bg-ivory overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, #1B2A4A 0px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #1B2A4A 0px, transparent 1px, transparent 40px)",
          }}
        />

        <FadeIn direction="up" delay={0}>
          <p className="text-xs tracking-[0.3em] uppercase text-gold font-sans mb-6">
            Together with their families
          </p>
        </FadeIn>

        <FadeIn direction="up" delay={0.08}>
          <h1
            className="font-serif font-light text-navy leading-[1.05]"
            style={{ fontSize: "clamp(3rem, 9vw, 6.5rem)", letterSpacing: "-0.02em" }}
          >
            {partner1Name}
            <span className="block text-gold" style={{ fontSize: "0.45em", letterSpacing: "0.15em" }}>
              &amp;
            </span>
            {partner2Name}
          </h1>
        </FadeIn>

        <FadeIn direction="up" delay={0.16}>
          <p className="text-sm tracking-[0.25em] uppercase text-navy/50 font-sans mt-6">
            {weddingDateFormatted}
          </p>
          {(venueName || venueAddress) && (
            <p className="text-sm text-navy/40 font-sans mt-2 tracking-wide">
              {venueName}{venueAddress && ` ◆ ${venueAddress}`}
            </p>
          )}
        </FadeIn>

        <FadeIn direction="up" delay={0.24}>
          <div className="mt-10">
            <Link
              href={`/${slug}/rsvp`}
              className="inline-flex items-center px-8 py-3 border border-navy text-navy text-xs tracking-widest uppercase font-sans hover:bg-navy hover:text-ivory transition-all duration-200"
            >
              Kindly RSVP
            </Link>
          </div>
        </FadeIn>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <div className="w-px h-10 bg-navy animate-pulse" />
        </div>
      </section>

      {/* Countdown */}
      <section className="bg-champagne/30 py-16 px-6">
        <div className="max-w-lg mx-auto">
          <FadeIn direction="up">
            <DeadlineCountdown rsvpDeadline={rsvpDeadline} rsvpHref={`/${slug}/rsvp`} />
          </FadeIn>
        </div>
      </section>

      {/* Events */}
      {events.length > 0 && (
        <section className="py-20 px-6 bg-ivory">
          <div className="max-w-5xl mx-auto">
            <FadeIn direction="up">
              <Divider diamond className="mb-16" />
            </FadeIn>
            <div className={`grid grid-cols-1 md:grid-cols-${Math.min(events.length, 3)} gap-8 md:gap-12`}>
              {events.map((event, i) => (
                <FadeIn key={event.id} direction="up" delay={i * 0.08}>
                  <article className="space-y-4">
                    <div className="flex items-baseline gap-4">
                      <h2 className="font-serif text-2xl font-light text-navy">{event.label}</h2>
                      <span className="text-xs tracking-widest uppercase text-gold font-sans">
                        {formatTime(event.date)}
                      </span>
                    </div>
                    <div className="w-8 h-px bg-gold opacity-60" />
                    {event.location && (
                      <p className="text-sm text-navy/60 font-sans leading-relaxed">{event.location}</p>
                    )}
                    {event.notes && (
                      <p className="text-sm text-navy/50 font-sans leading-relaxed italic">{event.notes}</p>
                    )}
                  </article>
                </FadeIn>
              ))}
            </div>
            <FadeIn direction="up" delay={0.2}>
              <Divider diamond className="mt-16" />
            </FadeIn>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 px-6 bg-navy text-center">
        <FadeIn direction="up">
          <p className="text-xs tracking-[0.3em] uppercase text-gold font-sans mb-4">
            We hope to see you there
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-ivory mb-8">
            Please join us
          </h2>
          <Link
            href={`/${slug}/rsvp`}
            className="inline-flex items-center px-8 py-3 bg-champagne text-navy text-xs tracking-widest uppercase font-sans hover:brightness-95 transition-all duration-200"
          >
            RSVP Now
          </Link>
        </FadeIn>
      </section>
    </>
  );
}
