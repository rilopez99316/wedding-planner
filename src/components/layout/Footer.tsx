import { weddingConfig } from "@/config/wedding-config";

const { couple, date, venue } = weddingConfig;

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Footer() {
  return (
    <footer className="bg-navy text-ivory/80">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
          {/* Column 1: Couple + date */}
          <div className="space-y-2">
            <p className="font-serif text-xl font-light text-ivory tracking-wide">
              {couple.displayNames}
            </p>
            <p className="text-sm tracking-wider uppercase text-champagne/70">
              {formatDate(date.wedding)}
            </p>
          </div>

          {/* Column 2: Venue */}
          <div className="space-y-2">
            <p className="text-xs tracking-widest uppercase text-gold font-sans mb-1">Venue</p>
            <p className="font-serif text-lg font-light text-ivory">{venue.name}</p>
            <p className="text-sm text-ivory/60 leading-relaxed">{venue.address}</p>
          </div>

          {/* Column 3: RSVP Deadline */}
          <div className="space-y-2">
            <p className="text-xs tracking-widest uppercase text-gold font-sans mb-1">
              RSVP Deadline
            </p>
            <p className="font-serif text-lg font-light text-ivory">
              {formatDate(date.rsvpDeadline)}
            </p>
            <p className="text-sm text-ivory/60">
              Please respond by this date so we can plan accordingly.
            </p>
          </div>
        </div>

        {/* Bottom rule */}
        <div className="mt-12 pt-6 border-t border-ivory/10 text-center">
          <p className="text-xs tracking-widest uppercase text-ivory/30 font-sans">
            Made with love ◆ {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
