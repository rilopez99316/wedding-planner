import FadeIn from "@/components/ui/FadeIn";
import Divider from "@/components/ui/Divider";
import { weddingConfig } from "@/config/wedding-config";

export default function SchedulePage() {
  return (
    <div className="min-h-screen bg-ivory flex flex-col items-center justify-center px-6 py-20 text-center">
      <FadeIn direction="up">
        <p className="text-xs tracking-[0.3em] uppercase text-gold font-sans mb-4">
          {weddingConfig.couple.displayNames}
        </p>
        <h1 className="font-serif text-5xl font-light text-navy mb-4">Schedule</h1>
        <Divider diamond className="max-w-xs mx-auto my-6" />
        <p className="text-navy/50 font-sans text-sm leading-relaxed max-w-sm mx-auto">
          The full schedule of events will be available here closer to the wedding date.
          <br />
          We can&apos;t wait to share every detail with you.
        </p>
      </FadeIn>
    </div>
  );
}
