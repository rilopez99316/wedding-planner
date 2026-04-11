import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import FadeIn from "@/components/ui/FadeIn";
import Divider from "@/components/ui/Divider";
import { formatDate, formatTime } from "@/lib/utils";

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
      {/* Header */}
      <div className="bg-champagne/20 border-b border-gold/10 pt-28 pb-14 px-6 text-center">
        <FadeIn direction="up">
          <p className="text-xs tracking-[0.3em] uppercase text-gold font-sans mb-3">
            {partner1Name} &amp; {partner2Name}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-light text-navy">
            Schedule of Events
          </h1>
        </FadeIn>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-16 space-y-12">
        {events.length === 0 ? (
          <FadeIn direction="up">
            <p className="text-center text-navy/40 font-sans text-sm">
              Schedule details coming soon.
            </p>
          </FadeIn>
        ) : (
          <>
            <FadeIn direction="up">
              <Divider diamond />
            </FadeIn>

            <div className="space-y-10">
              {events.map((event, i) => (
                <FadeIn key={event.id} direction="up" delay={i * 0.08}>
                  <article className="relative pl-8">
                    {/* Timeline line */}
                    {i < events.length - 1 && (
                      <div className="absolute left-[7px] top-8 bottom-[-2.5rem] w-px bg-gold/20" />
                    )}
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-gold bg-ivory" />

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-baseline gap-3">
                        <h2 className="font-serif text-xl font-light text-navy">
                          {event.label}
                        </h2>
                        <span className="text-xs tracking-widest uppercase text-gold font-sans">
                          {formatTime(event.date)}
                        </span>
                      </div>

                      <p className="text-xs text-navy/40 font-sans tracking-wide">
                        {formatDate(event.date)}
                      </p>

                      {event.location && (
                        <p className="text-sm text-navy/60 font-sans leading-relaxed">
                          {event.location}
                        </p>
                      )}

                      {event.notes && (
                        <p className="text-sm text-navy/40 font-sans leading-relaxed italic">
                          {event.notes}
                        </p>
                      )}
                    </div>
                  </article>
                </FadeIn>
              ))}
            </div>

            <FadeIn direction="up" delay={0.2}>
              <Divider diamond />
            </FadeIn>
          </>
        )}
      </div>
    </div>
  );
}
