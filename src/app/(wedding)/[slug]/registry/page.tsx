import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import FadeIn from "@/components/ui/FadeIn";
import Divider from "@/components/ui/Divider";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const wedding = await db.wedding.findUnique({ where: { slug: params.slug } });
  if (!wedding) return {};
  return {
    title: `Registry — ${wedding.partner1Name} & ${wedding.partner2Name}`,
  };
}

export default async function RegistryPage({ params }: { params: { slug: string } }) {
  const wedding = await db.wedding.findUnique({
    where: { slug: params.slug },
    include: {
      registries: {
        where: { isPublic: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!wedding) notFound();

  const { partner1Name, partner2Name, registries } = wedding;

  const giftRegistries = registries.filter((r) => r.type === "REGISTRY");
  const funds = registries.filter((r) => r.type === "FUND");
  const hasAny = giftRegistries.length > 0 || funds.length > 0;

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <div className="bg-champagne/20 border-b border-gold/10 pt-28 pb-14 px-6 text-center">
        <FadeIn direction="up">
          <p className="text-xs tracking-[0.3em] uppercase text-gold font-sans mb-3">
            {partner1Name} &amp; {partner2Name}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-light text-navy">Registry</h1>
        </FadeIn>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-16 space-y-10">
        <FadeIn direction="up">
          <Divider diamond />
        </FadeIn>

        <FadeIn direction="up" delay={0.08}>
          <p className="font-serif text-2xl font-light text-navy text-center">
            Your presence is the greatest gift
          </p>
          <p className="text-sm text-navy/50 font-sans leading-relaxed max-w-md mx-auto text-center mt-3">
            {hasAny
              ? "We are so grateful you'll be celebrating with us. If you wish to give a gift, you'll find our registries and funds below."
              : "We are so grateful you'll be celebrating with us. If you wish to give a gift, registry links will appear here soon."}
          </p>
        </FadeIn>

        {/* Gift Registries */}
        {giftRegistries.length > 0 && (
          <FadeIn direction="up" delay={0.14}>
            <div className="space-y-4">
              <p className="text-xs tracking-[0.25em] uppercase text-gold font-sans text-center">
                Gift Registries
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {giftRegistries.map((r) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card px-6 py-6 flex flex-col items-center gap-3 text-center hover:shadow-md transition-shadow group"
                  >
                    <p className="font-serif text-xl font-light text-navy group-hover:text-navy/80 transition-colors">
                      {r.store}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                      Shop Registry
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </FadeIn>
        )}

        {/* Funds & Donations */}
        {funds.length > 0 && (
          <FadeIn direction="up" delay={giftRegistries.length > 0 ? 0.22 : 0.14}>
            <div className="space-y-4">
              <p className="text-xs tracking-[0.25em] uppercase text-gold font-sans text-center">
                Honeymoon &amp; Funds
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {funds.map((r) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card px-6 py-6 flex flex-col items-center gap-2 text-center hover:shadow-md transition-shadow group"
                  >
                    <p className="font-serif text-xl font-light text-navy group-hover:text-navy/80 transition-colors">
                      {r.store}
                    </p>
                    {r.description && (
                      <p className="text-xs text-navy/50 font-sans">{r.description}</p>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-accent mt-1">
                      Contribute
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </FadeIn>
        )}

        <FadeIn direction="up" delay={0.3}>
          <Divider diamond />
        </FadeIn>
      </div>
    </div>
  );
}
