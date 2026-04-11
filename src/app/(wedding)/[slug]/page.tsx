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
    where:   { slug: params.slug },
    include: {
      events:       { orderBy: { order: "asc" } },
      weddingParty: { where: { isPublic: true }, orderBy: { displayOrder: "asc" } },
    },
  });

  if (!wedding) notFound();

  const { partner1Name, partner2Name, weddingDate, venueName, venueAddress, rsvpDeadline, events, weddingParty, slug, coverPhotoUrl } = wedding;

  const brideMembers = weddingParty.filter((m) => m.side === "BRIDE" || m.side === "BOTH");
  const groomMembers = weddingParty.filter((m) => m.side === "GROOM" || m.side === "BOTH");
  const showPartySection = weddingParty.length > 0;

  const weddingDateFormatted = new Date(weddingDate).toLocaleDateString("en-US", {
    weekday: "long",
    year:    "numeric",
    month:   "long",
    day:     "numeric",
  });

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background */}
        {coverPhotoUrl ? (
          <img
            src={coverPhotoUrl}
            alt={`${partner1Name} & ${partner2Name}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, #1B2A4A 0%, #0f1a2e 50%, #2a1f3d 100%)",
            }}
          >
            {/* Subtle texture overlay */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, #fff 0px, transparent 1px, transparent 8px), repeating-linear-gradient(-45deg, #fff 0px, transparent 1px, transparent 8px)",
              }}
            />
          </div>
        )}

        {/* Gradient overlay — stronger at bottom for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/75" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 py-24">
          <FadeIn direction="up" delay={0}>
            <p className="text-[10px] tracking-[0.45em] uppercase text-white/50 font-sans mb-10">
              Together with their families
            </p>
          </FadeIn>

          <FadeIn direction="up" delay={0.1}>
            <h1
              className="font-serif font-light text-white leading-[1.02]"
              style={{ fontSize: "clamp(3.5rem, 11vw, 9rem)", letterSpacing: "-0.02em" }}
            >
              {partner1Name}
            </h1>
            <p
              className="font-serif font-light text-white/40 my-2"
              style={{ fontSize: "clamp(1.5rem, 4vw, 3rem)", letterSpacing: "0.2em" }}
            >
              &amp;
            </p>
            <h1
              className="font-serif font-light text-white leading-[1.02]"
              style={{ fontSize: "clamp(3.5rem, 11vw, 9rem)", letterSpacing: "-0.02em" }}
            >
              {partner2Name}
            </h1>
          </FadeIn>

          <FadeIn direction="up" delay={0.2}>
            <div className="flex items-center gap-4 my-10">
              <div className="w-16 h-px bg-white/25" />
              <span className="text-white/30 text-xs">◆</span>
              <div className="w-16 h-px bg-white/25" />
            </div>
          </FadeIn>

          <FadeIn direction="up" delay={0.28}>
            <p className="text-xs tracking-[0.3em] uppercase text-white/60 font-sans">
              {weddingDateFormatted}
            </p>
            {(venueName || venueAddress) && (
              <p className="text-sm text-white/40 font-sans mt-2 tracking-wide">
                {venueName}{venueAddress && ` · ${venueAddress}`}
              </p>
            )}
          </FadeIn>

          <FadeIn direction="up" delay={0.36}>
            <div className="mt-12">
              <Link
                href={`/${slug}/rsvp`}
                className="inline-flex items-center gap-3 px-10 py-4 border border-white/40 text-white text-[10px] tracking-[0.3em] uppercase font-sans backdrop-blur-sm hover:bg-white hover:text-navy transition-all duration-300"
              >
                Kindly RSVP
              </Link>
            </div>
          </FadeIn>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-white/30">
          <span className="text-[9px] tracking-[0.4em] uppercase font-sans">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </section>

      {/* ── Countdown ────────────────────────────────────────────────────── */}
      <section className="bg-champagne/30 py-16 px-6">
        <div className="max-w-lg mx-auto">
          <FadeIn direction="up">
            <DeadlineCountdown rsvpDeadline={rsvpDeadline} rsvpHref={`/${slug}/rsvp`} />
          </FadeIn>
        </div>
      </section>

      {/* ── Events ───────────────────────────────────────────────────────── */}
      {events.length > 0 && (
        <section className="py-24 px-6 bg-ivory">
          <div className="max-w-5xl mx-auto">
            <FadeIn direction="up">
              <div className="text-center mb-16">
                <p className="text-[10px] tracking-[0.4em] uppercase text-gold font-sans mb-4">Join us for</p>
                <h2 className="font-serif text-4xl md:text-5xl font-light text-navy">The Celebration</h2>
                <Divider diamond className="mt-8" />
              </div>
            </FadeIn>

            <div className={`grid grid-cols-1 ${events.length === 2 ? "md:grid-cols-2" : events.length >= 3 ? "md:grid-cols-3" : ""} gap-px bg-navy/5`}>
              {events.map((event, i) => (
                <FadeIn key={event.id} direction="up" delay={i * 0.08}>
                  <article className="bg-ivory px-8 py-10 space-y-4 hover:bg-champagne/20 transition-colors duration-300">
                    <p className="text-[10px] tracking-[0.4em] uppercase text-gold font-sans">
                      {formatTime(event.date)}
                    </p>
                    <h3 className="font-serif text-2xl font-light text-navy">{event.label}</h3>
                    <div className="w-8 h-px bg-gold opacity-60" />
                    {event.location && (
                      <p className="text-sm text-navy/60 font-sans leading-relaxed">{event.location}</p>
                    )}
                    {event.notes && (
                      <p className="text-sm text-navy/40 font-sans leading-relaxed italic">{event.notes}</p>
                    )}
                  </article>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Wedding Party ────────────────────────────────────────────────── */}
      {showPartySection && (
        <section className="py-24 px-6 bg-champagne/20">
          <div className="max-w-5xl mx-auto">
            <FadeIn direction="up">
              <div className="text-center mb-16">
                <p className="text-[10px] tracking-[0.4em] uppercase text-gold font-sans mb-4">Our Beloved</p>
                <h2 className="font-serif text-4xl md:text-5xl font-light text-navy">Wedding Party</h2>
                <Divider diamond className="mt-8" />
              </div>
            </FadeIn>

            {/* Bride's side */}
            {brideMembers.length > 0 && (
              <div className="mb-16">
                <FadeIn direction="up">
                  <p className="text-[10px] tracking-[0.4em] uppercase text-navy/40 font-sans text-center mb-10">
                    Bride&apos;s Side
                  </p>
                </FadeIn>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
                  {brideMembers.map((member, i) => (
                    <FadeIn key={member.id} direction="up" delay={i * 0.07}>
                      <div className="flex flex-col items-center text-center gap-3">
                        {member.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={member.photoUrl}
                            alt={member.name}
                            className="w-24 h-24 rounded-full object-cover shadow-apple-md ring-4 ring-white"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-champagne flex items-center justify-center shadow-apple-md ring-4 ring-white">
                            <span className="font-serif text-2xl font-light text-navy/60">
                              {member.name.trim().split(/\s+/).map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-serif text-lg font-light text-navy">{member.name}</p>
                          <p className="text-[10px] tracking-[0.3em] uppercase text-gold font-sans mt-0.5">
                            {member.role === "MOH" ? "Maid of Honor"
                              : member.role === "BRIDESMAID" ? "Bridesmaid"
                              : member.role === "BEST_MAN" ? "Best Man"
                              : member.role === "GROOMSMAN" ? "Groomsman"
                              : member.role === "FLOWER_GIRL" ? "Flower Girl"
                              : member.role === "RING_BEARER" ? "Ring Bearer"
                              : member.role === "PARENT_OF_BRIDE" ? "Parent of Bride"
                              : member.role === "PARENT_OF_GROOM" ? "Parent of Groom"
                              : member.role === "OFFICIANT" ? "Officiant"
                              : ""}
                          </p>
                        </div>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              </div>
            )}

            {/* Groom's side */}
            {groomMembers.length > 0 && (
              <div>
                <FadeIn direction="up">
                  <p className="text-[10px] tracking-[0.4em] uppercase text-navy/40 font-sans text-center mb-10">
                    Groom&apos;s Side
                  </p>
                </FadeIn>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
                  {groomMembers.map((member, i) => (
                    <FadeIn key={member.id} direction="up" delay={i * 0.07}>
                      <div className="flex flex-col items-center text-center gap-3">
                        {member.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={member.photoUrl}
                            alt={member.name}
                            className="w-24 h-24 rounded-full object-cover shadow-apple-md ring-4 ring-white"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-champagne flex items-center justify-center shadow-apple-md ring-4 ring-white">
                            <span className="font-serif text-2xl font-light text-navy/60">
                              {member.name.trim().split(/\s+/).map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-serif text-lg font-light text-navy">{member.name}</p>
                          <p className="text-[10px] tracking-[0.3em] uppercase text-gold font-sans mt-0.5">
                            {member.role === "MOH" ? "Maid of Honor"
                              : member.role === "BRIDESMAID" ? "Bridesmaid"
                              : member.role === "BEST_MAN" ? "Best Man"
                              : member.role === "GROOMSMAN" ? "Groomsman"
                              : member.role === "FLOWER_GIRL" ? "Flower Girl"
                              : member.role === "RING_BEARER" ? "Ring Bearer"
                              : member.role === "PARENT_OF_BRIDE" ? "Parent of Bride"
                              : member.role === "PARENT_OF_GROOM" ? "Parent of Groom"
                              : member.role === "OFFICIANT" ? "Officiant"
                              : ""}
                          </p>
                        </div>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="relative py-28 px-6 overflow-hidden">
        {coverPhotoUrl ? (
          <img
            src={coverPhotoUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-navy" />
        )}
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 text-center">
          <FadeIn direction="up">
            <p className="text-[10px] tracking-[0.45em] uppercase text-white/50 font-sans mb-6">
              We hope to see you there
            </p>
            <h2
              className="font-serif font-light text-white"
              style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", letterSpacing: "-0.02em" }}
            >
              Please join us
            </h2>
            <div className="flex items-center justify-center gap-4 my-8">
              <div className="w-12 h-px bg-white/20" />
              <span className="text-white/20 text-xs">◆</span>
              <div className="w-12 h-px bg-white/20" />
            </div>
            <Link
              href={`/${slug}/rsvp`}
              className="inline-flex items-center px-10 py-4 bg-white/10 border border-white/40 text-white text-[10px] tracking-[0.3em] uppercase font-sans backdrop-blur-sm hover:bg-white hover:text-navy transition-all duration-300"
            >
              RSVP Now
            </Link>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
