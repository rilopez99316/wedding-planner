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
      {/* Page header */}
      <div className="bg-champagne/20 border-b border-gold/10 py-14 px-6 text-center">
        <FadeIn direction="up">
          <p className="text-xs tracking-[0.3em] uppercase text-gold font-sans mb-3">
            {coupleNames}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-light text-navy">RSVP</h1>
        </FadeIn>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-14 space-y-10">
        <FadeIn direction="up">
          <DeadlineCountdown rsvpDeadline={wedding.rsvpDeadline} />
        </FadeIn>

        <FadeIn direction="up" delay={0.08}>
          <Divider diamond />
        </FadeIn>

        <RSVPPageClient
          wedding={{
            id:          wedding.id,
            slug:        wedding.slug,
            partner1Name: wedding.partner1Name,
            partner2Name: wedding.partner2Name,
            events:      wedding.events.map((e) => ({
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
                  id:                initialGroup.id,
                  groupName:         initialGroup.groupName,
                  hasPlusOne:        initialGroup.hasPlusOne,
                  plusOneNameIfKnown: initialGroup.plusOneNameIfKnown ?? undefined,
                  hasExistingResponse: !!initialGroup.rsvpResponse,
                  guests:            initialGroup.guests.map((g) => ({
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
