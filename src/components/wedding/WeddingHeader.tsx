"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface WeddingHeaderProps {
  partner1: string;
  partner2: string;
  slug: string;
}

export default function WeddingHeader({ partner1, partner2, slug }: WeddingHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: "Home",     href: `/${slug}` },
    { label: "Schedule", href: `/${slug}/schedule` },
    { label: "Registry", href: `/${slug}/registry` },
    { label: "RSVP",     href: `/${slug}/rsvp` },
  ];

  return (
    <header className="sticky top-0 z-50 bg-ivory/80 backdrop-blur-md border-b border-gold/10">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Couple names logotype */}
        <Link href={`/${slug}`} className="font-serif text-navy font-light text-lg tracking-tight">
          {partner1} <span className="text-gold">&</span> {partner2}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-xs tracking-widest uppercase font-sans transition-colors duration-150",
                  link.label === "RSVP"
                    ? "bg-navy text-champagne px-4 py-1.5 hover:brightness-110"
                    : isActive
                    ? "text-navy"
                    : "text-navy/50 hover:text-navy"
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
        >
          <span className={cn("w-5 h-px bg-navy transition-transform", menuOpen && "translate-y-1.5 rotate-45")} />
          <span className={cn("w-5 h-px bg-navy transition-opacity", menuOpen && "opacity-0")} />
          <span className={cn("w-5 h-px bg-navy transition-transform", menuOpen && "-translate-y-1.5 -rotate-45")} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gold/10 bg-ivory px-6 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block text-xs tracking-widest uppercase font-sans text-navy/60 hover:text-navy py-1"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
