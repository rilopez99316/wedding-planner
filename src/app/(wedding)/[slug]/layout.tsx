import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import WeddingHeader from "@/components/wedding/WeddingHeader";
import WeddingFooter from "@/components/wedding/WeddingFooter";
import { getPalette } from "@/lib/weddingPalettes";

export default async function WeddingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const wedding = await db.wedding.findUnique({
    where: { slug: params.slug },
  });

  if (!wedding) notFound();

  const palette = getPalette(wedding.colorPalette);

  return (
    <div
      className="wedding-page min-h-screen flex flex-col"
      data-dark={palette.dark ? "true" : undefined}
      style={{
        "--w-ivory":        palette.vars.ivory,
        "--w-navy":         palette.vars.navy,
        "--w-gold":         palette.vars.gold,
        "--w-champagne":    palette.vars.champagne,
        "--w-hero-start":   palette.vars.heroStart,
        "--w-hero-mid":     palette.vars.heroMid,
        "--wedding-accent": palette.vars.weddingAccent,
      } as React.CSSProperties}
    >
      <WeddingHeader
        partner1={wedding.partner1Name}
        partner2={wedding.partner2Name}
        slug={wedding.slug}
        hasCoverPhoto={!!wedding.coverPhotoUrl}
      />
      {/* No top padding on home — hero is full-screen behind the fixed header */}
      <main className="flex-1">{children}</main>
      <WeddingFooter
        partner1={wedding.partner1Name}
        partner2={wedding.partner2Name}
        weddingDate={wedding.weddingDate}
        venueName={wedding.venueName}
        venueAddress={wedding.venueAddress}
        rsvpDeadline={wedding.rsvpDeadline}
        slug={wedding.slug}
      />
    </div>
  );
}
