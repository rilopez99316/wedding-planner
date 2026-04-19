import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import FadeIn from "@/components/ui/FadeIn";
import Divider from "@/components/ui/Divider";

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

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

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

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden pt-40 pb-36 flex flex-col items-center text-center"
        style={{ background: "linear-gradient(160deg, rgb(var(--w-hero-start)) 0%, rgb(var(--w-hero-mid)) 60%, rgb(var(--w-hero-mid)) 100%)" }}
      >
        {/* Grain noise texture — print-quality depth */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: 0.06, backgroundImage: GRAIN_SVG, backgroundSize: "200px 200px" }}
        />

        {/* Ghost background word */}
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden font-serif font-light text-white"
          style={{ fontSize: "clamp(5rem, 22vw, 16rem)", opacity: 0.033, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}
        >
          Gifts
        </span>

        {/* Diamond lattice overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.028,
            backgroundImage:
              "repeating-linear-gradient(45deg, #fff 0px, transparent 1px, transparent 8px), repeating-linear-gradient(-45deg, #fff 0px, transparent 1px, transparent 8px)",
          }}
        />

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center px-6">
          <FadeIn direction="up" delay={0}>
            <p className="text-[10px] tracking-[0.45em] uppercase text-white/45 font-sans mb-8">
              {partner1Name} &amp; {partner2Name}
            </p>
          </FadeIn>

          <FadeIn direction="up" delay={0.1}>
            <BotanicalOrnament className="w-28 text-gold/50 mb-8" />
          </FadeIn>

          {/* Cinematic per-character title */}
          <h1
            className="font-serif font-light text-white"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)", letterSpacing: "-0.02em" }}
          >
            {"Registry".split("").map((char, i) => (
              <span
                key={i}
                className="inline-block animate-fade-in [animation-fill-mode:both]"
                style={{
                  animationDelay: `${0.38 + i * 0.07}s`,
                  animationDuration: "0.65s",
                  animationTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                }}
              >
                {char}
              </span>
            ))}
          </h1>

          {/* Gold rule */}
          <FadeIn direction="up" delay={0.9}>
            <div className="w-14 h-px mt-8" style={{ background: "rgb(var(--w-gold) / 0.35)" }} />
          </FadeIn>

          <FadeIn direction="up" delay={1.0}>
            <div className="flex items-center gap-5 mt-6">
              <div className="w-20 h-px bg-white/15" />
              <span className="text-white/20 text-[10px]">◆</span>
              <div className="w-20 h-px bg-white/15" />
            </div>
          </FadeIn>
        </div>

        {/* Fade into page */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, rgb(var(--w-ivory)))" }}
        />
      </section>

      {/* ── Sentiment ────────────────────────────────────────────────────── */}
      <section className="pt-20 pb-14 px-6 bg-champagne/10">
        <div className="max-w-2xl mx-auto text-center">
          <FadeIn direction="up">
            {/* Decorative opening quote — enlarged */}
            <span
              aria-hidden="true"
              className="block font-serif text-gold/30 leading-none mb-2 select-none"
              style={{ fontSize: "7rem" }}
            >
              &ldquo;
            </span>

            <p className="font-serif text-3xl md:text-4xl font-light text-navy leading-snug -mt-8">
              Your presence is the greatest gift
            </p>

            <p className="font-serif italic text-xl font-light text-navy/55 max-w-md mx-auto mt-6 leading-relaxed">
              {hasAny
                ? "We are so grateful you'll be celebrating with us. If you wish to give a gift, you'll find our registries and funds below."
                : "We are so grateful you'll be celebrating with us. If you wish to give a gift, registry links will appear here soon."}
            </p>
          </FadeIn>

          <FadeIn direction="up" delay={0.1}>
            <div className="mt-12">
              <Divider diamond />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Gift Registries — editorial rows with ordinals + champagne swipe ─ */}
      {giftRegistries.length > 0 && (
        <section className="py-12 px-6">
          <div className="max-w-2xl mx-auto">
            <FadeIn direction="up">
              <p className="text-[10px] tracking-[0.3em] uppercase text-gold font-sans text-center mb-2">
                Gift Registries
              </p>
            </FadeIn>

            <div>
              {giftRegistries.map((r, i) => {
                const ordinal = String(i + 1).padStart(2, "0");
                return (
                  <FadeIn key={r.id} direction="up" delay={i * 0.1}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={[
                        "group relative overflow-hidden",
                        "flex items-center",
                        "py-10 -mx-4 px-4",
                        "border-b border-gold/20",
                        i === 0 ? "border-t border-gold/20" : "",
                        "rounded-xl",
                        "transition-all duration-300",
                      ].join(" ")}
                    >
                      {/* Champagne swipe — reveals on hover from left */}
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 rounded-xl bg-champagne/25 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                      />

                      {/* Row ordinal */}
                      <span className="relative z-10 text-[10px] tracking-[0.3em] text-gold/40 font-sans mr-8 shrink-0 self-start pt-3 tabular-nums">
                        {ordinal}
                      </span>

                      {/* Store info */}
                      <div className="relative z-10 flex-1">
                        <p className="text-[10px] tracking-[0.3em] uppercase text-gold/60 font-sans mb-2">
                          Gift Registry
                        </p>
                        <p
                          className="font-serif font-light text-navy group-hover:text-navy/70 transition-colors duration-300"
                          style={{ fontSize: "clamp(2.25rem, 5vw, 3.5rem)" }}
                        >
                          {r.store}
                        </p>
                      </div>

                      {/* Hover arrow with translate */}
                      <div className="relative z-10 flex items-center gap-2 text-navy/30 group-hover:text-navy/65 group-hover:translate-x-2 group-hover:gap-4 transition-all duration-300 shrink-0 ml-6">
                        <span className="hidden sm:inline text-[10px] tracking-[0.25em] uppercase font-sans">
                          View Registry
                        </span>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </div>
                    </a>
                  </FadeIn>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Honeymoon & Funds — immersive dark cards with grain depth ────── */}
      {funds.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-2xl mx-auto">
            <FadeIn direction="up">
              <div className="flex flex-col items-center mb-12">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 48 48"
                  fill="none"
                  className="w-9 h-9 text-gold/45 mb-3"
                >
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="0.9" />
                  <circle cx="24" cy="24" r="13" stroke="currentColor" strokeWidth="0.6" />
                  <circle cx="24" cy="24" r="3" fill="currentColor" opacity="0.4" />
                </svg>
                <p className="text-[10px] tracking-[0.3em] uppercase text-gold font-sans">
                  Honeymoon &amp; Funds
                </p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {funds.map((r, i) => (
                <FadeIn key={r.id} direction="up" delay={i * 0.1}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative rounded-2xl p-9 overflow-hidden hover:brightness-110 transition-all duration-300 block min-h-52"
                    style={{
                      background: "linear-gradient(135deg, rgb(var(--w-hero-start)), rgb(var(--w-hero-mid)))",
                      borderTop: "1px solid rgba(var(--w-gold), 0.2)",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.20), 0 4px 16px rgba(0,0,0,0.12)",
                    }}
                  >
                    {/* Grain texture on card */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 pointer-events-none rounded-2xl"
                      style={{ opacity: 0.04, backgroundImage: GRAIN_SVG, backgroundSize: "200px 200px" }}
                    />

                    {/* Decorative concentric rings */}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 120 120"
                      fill="none"
                      className="absolute -right-4 -bottom-4 w-44 h-44 text-white pointer-events-none"
                      style={{ opacity: 0.055 }}
                    >
                      <circle cx="80" cy="80" r="65" stroke="currentColor" strokeWidth="0.8" />
                      <circle cx="80" cy="80" r="50" stroke="currentColor" strokeWidth="0.5" />
                      <circle cx="80" cy="80" r="35" stroke="currentColor" strokeWidth="0.4" />
                      <circle cx="80" cy="80" r="4" fill="currentColor" opacity="0.6" />
                    </svg>

                    <p className="font-serif text-3xl md:text-4xl font-light text-white mb-3 relative z-10">
                      {r.store}
                    </p>

                    {r.description && (
                      <p className="font-serif italic text-base text-white/65 leading-relaxed mb-8 relative z-10">
                        {r.description}
                      </p>
                    )}

                    <span className="inline-flex items-center gap-2 text-gold text-[10px] tracking-[0.28em] uppercase font-sans group-hover:gap-3 transition-all duration-300 relative z-10 mt-2">
                      Contribute
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </span>
                  </a>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!hasAny && (
        <section className="py-20 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <FadeIn direction="up">
              <BotanicalOrnament className="w-24 text-gold/25 mx-auto mb-8" />
              <p className="font-serif text-2xl font-light text-navy/35">
                Registry links coming soon
              </p>
            </FadeIn>
          </div>
        </section>
      )}

      {/* ── Closing ornament — paired botanicals ─────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <FadeIn direction="up" delay={0.1}>
            <div className="flex flex-col items-center gap-10">
              <div className="flex items-center gap-8">
                <BotanicalOrnament className="w-20 text-gold/20 [transform:scaleX(-1)]" />
                <div className="flex flex-col items-center gap-2">
                  <span className="text-gold/30 text-[8px]">◆</span>
                  <div className="w-px h-8" style={{ background: "rgb(var(--w-gold) / 0.15)" }} />
                  <span className="text-gold/30 text-[8px]">◆</span>
                </div>
                <BotanicalOrnament className="w-20 text-gold/20" />
              </div>
              <Divider diamond />
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
