import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import FadeIn from "@/components/ui/FadeIn";
import Divider from "@/components/ui/Divider";
import DeadlineCountdown from "@/components/rsvp/DeadlineCountdown";
import RSVPPageClient from "@/components/rsvp/RSVPPageClient";

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
      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <div className="relative h-[50vh] min-h-[320px] flex flex-col items-center justify-center overflow-hidden">
        {/* Background */}
        {wedding.coverPhotoUrl ? (
          <img
            src={wedding.coverPhotoUrl}
            alt={coupleNames}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, #1B2A4A 0%, #0f1a2e 50%, #2a1f3d 100%)" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/75" />

        {/* Content */}
        <div className="relative z-10 text-center px-6 pt-16">
          <FadeIn direction="up">
            <p className="text-[10px] tracking-[0.45em] uppercase text-white/50 font-sans mb-4">
              {coupleNames}
            </p>
            <h1
              className="font-serif font-light text-white"
              style={{ fontSize: "clamp(3rem, 8vw, 6rem)", letterSpacing: "-0.02em" }}
            >
              RSVP
            </h1>
            <div className="flex items-center justify-center gap-4 mt-5">
              <div className="w-10 h-px bg-white/20" />
              <span className="text-white/20 text-[10px]">◆</span>
              <div className="w-10 h-px bg-white/20" />
            </div>
          </FadeIn>
        </div>
      </div>

      {/* ── Form container ───────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-6 py-14 space-y-10">
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
                  id:                 initialGroup.id,
                  groupName:          initialGroup.groupName,
                  hasPlusOne:         initialGroup.hasPlusOne,
                  plusOneNameIfKnown: initialGroup.plusOneNameIfKnown ?? undefined,
                  hasExistingResponse: !!initialGroup.rsvpResponse,
                  guests:             initialGroup.guests.map((g) => ({
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
