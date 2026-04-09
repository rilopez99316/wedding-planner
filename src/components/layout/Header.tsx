"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Nav from "./Nav";
import { weddingConfig } from "@/config/wedding-config";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-ivory/90 backdrop-blur-md shadow-sm shadow-navy/10"
          : "bg-ivory/70 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        {/* Couple names — serif logotype */}
        <Link
          href="/"
          className="font-serif text-lg font-light tracking-wider text-navy hover:text-gold transition-colors duration-200"
        >
          {weddingConfig.couple.displayNames}
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:block">
          <Nav />
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col justify-center gap-1.5 w-10 h-10 items-center"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          <span
            className={`block h-px w-6 bg-navy transition-all duration-300 origin-center ${
              menuOpen ? "rotate-45 translate-y-[5px]" : ""
            }`}
          />
          <span
            className={`block h-px bg-navy transition-all duration-300 ${
              menuOpen ? "w-0 opacity-0" : "w-6"
            }`}
          />
          <span
            className={`block h-px w-6 bg-navy transition-all duration-300 origin-center ${
              menuOpen ? "-rotate-45 -translate-y-[5px]" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden md:hidden border-t border-gold/20"
          >
            <div className="px-6 py-6 bg-ivory/95 backdrop-blur-md">
              <Nav onLinkClick={() => setMenuOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
