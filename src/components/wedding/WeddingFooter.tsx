import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface WeddingFooterProps {
  partner1: string;
  partner2: string;
  weddingDate: Date;
  venueName?: string | null;
  venueAddress?: string | null;
  rsvpDeadline: Date;
  slug: string;
}

export default function WeddingFooter({
  partner1,
  partner2,
  weddingDate,
  venueName,
  venueAddress,
  rsvpDeadline,
  slug,
}: WeddingFooterProps) {
  return (
    <footer
      className="py-12 px-6 text-white"
      style={{ background: "rgb(var(--w-hero-mid))" }}
    >
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
        <div>
          <p className="font-serif text-xl font-light mb-1">
            {partner1} <span className="text-gold">&</span> {partner2}
          </p>
          <p className="text-xs text-white/40 font-sans tracking-wider">
            {formatDate(weddingDate)}
          </p>
        </div>
        {(venueName || venueAddress) && (
          <div>
            <p className="text-xs tracking-widest uppercase text-white/30 font-sans mb-2">Venue</p>
            {venueName && <p className="text-sm text-white/70 font-sans">{venueName}</p>}
            {venueAddress && <p className="text-xs text-white/40 font-sans mt-1">{venueAddress}</p>}
          </div>
        )}
        <div>
          <p className="text-xs tracking-widest uppercase text-white/30 font-sans mb-2">RSVP by</p>
          <p className="text-sm text-white/70 font-sans">{formatDate(rsvpDeadline)}</p>
          <Link
            href={`/${slug}/rsvp`}
            className="inline-block mt-3 text-xs tracking-widest uppercase border border-gold/40 text-gold px-4 py-1.5 hover:bg-gold/10 transition-colors font-sans"
          >
            RSVP
          </Link>
        </div>
      </div>
      <div className="max-w-5xl mx-auto border-t border-white/10 mt-10 pt-6 text-center">
        <p className="text-xs text-white/20 font-sans">
          Crafted with Vows
        </p>
      </div>
    </footer>
  );
}
