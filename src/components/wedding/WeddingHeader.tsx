"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface WeddingHeaderProps {
  partner1: string;
  partner2: string;
  slug: string;
  hasCoverPhoto: boolean;
}

export default function WeddingHeader({ partner1, partner2, slug, hasCoverPhoto }: WeddingHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isHome = pathname === `/${slug}`;
  const transparent = hasCoverPhoto && isHome && !scrolled && !menuOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Home",     href: `/${slug}` },
    { label: "Schedule", href: `/${slug}/schedule` },
    { label: "Registry", href: `/${slug}/registry` },
    { label: "RSVP",     href: `/${slug}/rsvp` },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        transparent
          ? "bg-transparent border-transparent"
          : "bg-ivory/90 backdrop-blur-md border-b border-gold/10 shadow-sm shadow-navy/5"
      )}
    >
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logotype */}
        <Link
          href={`/${slug}`}
          className={cn(
            "font-serif font-light text-lg tracking-tight transition-colors duration-500",
            transparent ? "text-white/90" : "text-navy"
          )}
        >
          {partner1} <span className={cn("transition-colors duration-500", transparent ? "text-white/50" : "text-gold")}>&</span> {partner2}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            if (link.label === "RSVP") {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-[10px] tracking-[0.25em] uppercase font-sans px-5 py-2 transition-all duration-300",
                    transparent
                      ? "border border-white/50 text-white hover:bg-white hover:text-navy"
                      : "bg-navy text-champagne hover:brightness-110"
                  )}
                >
                  RSVP
                </Link>
              );
            }
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-[10px] tracking-[0.25em] uppercase font-sans transition-colors duration-300",
                  transparent
                    ? isActive ? "text-white" : "text-white/60 hover:text-white"
                    : isActive ? "text-navy" : "text-navy/50 hover:text-navy"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={cn("w-5 h-px transition-all duration-300", transparent ? "bg-white" : "bg-navy", menuOpen && "translate-y-[7px] rotate-45")} />
          <span className={cn("w-5 h-px transition-all duration-300", transparent ? "bg-white" : "bg-navy", menuOpen && "opacity-0")} />
          <span className={cn("w-5 h-px transition-all duration-300", transparent ? "bg-white" : "bg-navy", menuOpen && "-translate-y-[7px] -rotate-45")} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-ivory border-t border-gold/10 px-6 py-5 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block text-[10px] tracking-[0.3em] uppercase font-sans text-navy/60 hover:text-navy py-1 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
