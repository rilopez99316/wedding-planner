import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import FadeIn from "@/components/ui/FadeIn";
import Divider from "@/components/ui/Divider";
import DeadlineCountdown from "@/components/rsvp/DeadlineCountdown";
import RSVPPageClient from "@/components/rsvp/RSVPPageClient";

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

interface RSVPPageProps {
  params: { slug: string };
  searchParams: { token?: string };
}

export default async function RSVPPage({ params, searchParams }: RSVPPageProps) {
  const wedding = await db.wedding.findUnique({
    where: { slug: params.slug },
    include: { events: { orderBy: { order: "asc" } } },
  });

  if (!wedding) notFound();

  // Resolve guest group from token
  let initialGroup = null;
  if (searchParams.token) {
    const guest = await db.guest.findUnique({
      where: { invitationToken: searchParams.token },
      include: {
        group: {
          include: {
            guests: true,
            allowedEvents: { include: { event: true } },
            rsvpResponse: true,
          },
        },
      },
    });
    if (guest?.group.weddingId === wedding.id) {
      initialGroup = guest.group;
    }
  }

  const coupleNames = `${wedding.partner1Name} & ${wedding.partner2Name}`;

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
          Reply
        </span>

        {/* Diamond texture */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.028,
            backgroundImage:
              "repeating-linear-gradient(45deg, #fff 0px, transparent 1px, transparent 8px), repeating-linear-gradient(-45deg, #fff 0px, transparent 1px, transparent 8px)",
          }}
        />

        {/* Cover photo overlay if present */}
        {wedding.coverPhotoUrl && (
          <>
            <img
              src={wedding.coverPhotoUrl}
              alt={coupleNames}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/80" />
          </>
        )}

        <div className="relative z-10 flex flex-col items-center px-6">
          <FadeIn direction="up" delay={0}>
            <p className="text-[10px] tracking-[0.45em] uppercase text-white/45 font-sans mb-8">
              {coupleNames}
            </p>
          </FadeIn>

          <FadeIn direction="up" delay={0.1}>
            <BotanicalOrnament className="w-28 text-gold/50 mb-7" />
          </FadeIn>

          <FadeIn direction="up" delay={0.16}>
            <p className="text-[10px] tracking-[0.35em] uppercase text-white/30 font-sans mb-4">
              Kindly reply
            </p>
          </FadeIn>

          <FadeIn direction="up" delay={0.22}>
            <h1
              className="font-serif font-light text-white"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)", letterSpacing: "-0.02em" }}
            >
              RSVP
            </h1>
          </FadeIn>

          <FadeIn direction="up" delay={0.3}>
            <div className="flex items-center gap-5 mt-9">
              <div className="w-20 h-px bg-white/15" />
              <span className="text-white/20 text-[10px]">◆</span>
              <div className="w-20 h-px bg-white/15" />
            </div>
          </FadeIn>
        </div>

        {/* Fade into ivory */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, rgb(var(--w-ivory)))" }}
        />
      </section>

      {/* ── Countdown + Form ─────────────────────────────────────────────── */}
      <div className="max-w-xl mx-auto px-6 py-16 space-y-12">
        <FadeIn direction="up">
          <DeadlineCountdown rsvpDeadline={wedding.rsvpDeadline} />
        </FadeIn>

        <FadeIn direction="up" delay={0.08}>
          <Divider diamond />
        </FadeIn>

        <RSVPPageClient
          wedding={{
            id:           wedding.id,
            slug:         wedding.slug,
            partner1Name: wedding.partner1Name,
            partner2Name: wedding.partner2Name,
            events:       wedding.events.map((e) => ({
              id:    e.id,
              key:   e.key,
              label: e.label,
              date:  e.date.toISOString(),
            })),
            rsvpDeadline: wedding.rsvpDeadline.toISOString(),
          }}
          initialGroup={
            initialGroup
              ? {
                  id:                  initialGroup.id,
                  groupName:           initialGroup.groupName,
                  hasPlusOne:          initialGroup.hasPlusOne,
                  plusOneNameIfKnown:  initialGroup.plusOneNameIfKnown ?? undefined,
                  hasExistingResponse: !!initialGroup.rsvpResponse,
                  guests:              initialGroup.guests.map((g) => ({
                    id:        g.id,
                    firstName: g.firstName,
                    lastName:  g.lastName,
                    isPlusOne: g.isPlusOne,
                  })),
                  allowedEventKeys: initialGroup.allowedEvents.map((ae) => ae.event.key),
                  token:            searchParams.token,
                }
              : null
          }
        />
      </div>
    </div>
  );
}
