import Link from "next/link";
import { weddingConfig } from "@/config/wedding-config";
import FadeIn from "@/components/ui/FadeIn";
import Button from "@/components/ui/Button";
import Divider from "@/components/ui/Divider";
import DeadlineCountdown from "@/components/rsvp/DeadlineCountdown";

const { couple, date, venue } = weddingConfig;

function formatWeddingDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const detailCards = [
  {
    title: "Ceremony",
    body: "A traditional ceremony set in the heart of Napa Valley, surrounded by rolling vineyards and golden light.",
    time: "4:00 PM",
  },
  {
    title: "Reception",
    body: "An intimate dinner reception celebrating love, family, and the beginning of our new chapter together.",
    time: "6:00 PM",
  },
  {
    title: "Dress Code",
    body: "Black tie preferred. We invite you to dress in shades of navy, champagne, ivory, or white.",
    time: null,
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 text-center bg-ivory overflow-hidden">
        {/* Subtle background texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
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

        <FadeIn direction="up" delay={0.1}>
          <h1
            className="font-serif font-light text-navy text-balance leading-[1.05]"
            style={{ fontSize: "clamp(3rem, 9vw, 6.5rem)", letterSpacing: "-0.02em" }}
          >
            {couple.partner1}
            <span className="block text-gold" style={{ fontSize: "0.45em", letterSpacing: "0.15em" }}>
              &amp;
            </span>
            {couple.partner2}
          </h1>
        </FadeIn>

        <FadeIn direction="up" delay={0.2}>
          <p className="text-sm tracking-[0.25em] uppercase text-navy/50 font-sans mt-6">
            {formatWeddingDate(date.wedding)}
          </p>
          <p className="text-sm text-navy/40 font-sans mt-2 tracking-wide">
            {venue.name} ◆ {venue.shortAddress}
          </p>
        </FadeIn>

        <FadeIn direction="up" delay={0.35}>
          <div className="mt-10">
            <Link href="/rsvp">
              <Button variant="primary">Kindly RSVP</Button>
            </Link>
          </div>
        </FadeIn>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <div className="w-px h-10 bg-navy animate-pulse" />
        </div>
      </section>

      {/* Countdown */}
      <section className="bg-champagne/30 py-16 px-6">
        <div className="max-w-lg mx-auto">
          <FadeIn direction="up">
            <DeadlineCountdown />
          </FadeIn>
        </div>
      </section>

      {/* Detail cards */}
      <section className="py-20 px-6 bg-ivory">
        <div className="max-w-5xl mx-auto">
          <FadeIn direction="up">
            <Divider diamond className="mb-16" />
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {detailCards.map((card, i) => (
              <FadeIn key={card.title} direction="up" delay={i * 0.1}>
                <article className="space-y-4">
                  <div className="flex items-baseline gap-4">
                    <h2 className="font-serif text-2xl font-light text-navy">{card.title}</h2>
                    {card.time && (
                      <span className="text-xs tracking-widest uppercase text-gold font-sans">
                        {card.time}
                      </span>
                    )}
                  </div>
                  <div className="w-8 h-px bg-gold opacity-60" />
                  <p className="text-sm text-navy/60 font-sans leading-relaxed">{card.body}</p>
                </article>
              </FadeIn>
            ))}
          </div>
          <FadeIn direction="up" delay={0.3}>
            <Divider diamond className="mt-16" />
          </FadeIn>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-20 px-6 bg-navy text-center">
        <FadeIn direction="up">
          <p className="text-xs tracking-[0.3em] uppercase text-gold font-sans mb-4">
            We hope to see you there
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-ivory mb-8">
            Please join us
          </h2>
          <Link href="/rsvp">
            <Button variant="secondary">RSVP Now</Button>
          </Link>
        </FadeIn>
      </section>
    </>
  );
}
