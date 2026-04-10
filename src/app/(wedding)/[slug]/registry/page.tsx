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
  const wedding = await db.wedding.findUnique({ where: { slug: params.slug } });

  if (!wedding) notFound();

  const { partner1Name, partner2Name } = wedding;

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <div className="bg-champagne/20 border-b border-gold/10 py-14 px-6 text-center">
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
          <div className="glass-card px-8 py-10 text-center space-y-4">
            <p className="font-serif text-2xl font-light text-navy">
              Your presence is the greatest gift
            </p>
            <p className="text-sm text-navy/50 font-sans leading-relaxed max-w-md mx-auto">
              We are so grateful you&apos;ll be celebrating with us. If you wish to give a gift,
              registry links will appear here soon.
            </p>
          </div>
        </FadeIn>

        <FadeIn direction="up" delay={0.16}>
          <Divider diamond />
        </FadeIn>
      </div>
    </div>
  );
}
