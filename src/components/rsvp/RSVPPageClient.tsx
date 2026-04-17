"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GuestSearch from "./GuestSearch";
import RSVPForm from "./RSVPForm";
import Divider from "@/components/ui/Divider";
import FadeIn from "@/components/ui/FadeIn";

// ── Shared public-facing types ─────────────────────────────────────────────

export interface WeddingPublicData {
  id: string;
  slug: string;
  partner1Name: string;
  partner2Name: string;
  events: { id: string; key: string; label: string; date: string }[];
  rsvpDeadline: string;
}

export interface GroupPublicData {
  id: string;
  groupName: string;
  hasPlusOne: boolean;
  plusOneNameIfKnown?: string;
  hasExistingResponse: boolean;
  guests: { id: string; firstName: string; lastName: string; isPlusOne: boolean }[];
  allowedEventKeys: string[];
  token?: string;
}

// ── Component ──────────────────────────────────────────────────────────────

interface RSVPPageClientProps {
  wedding: WeddingPublicData;
  initialGroup: GroupPublicData | null;
}

type View = "search" | "form" | "thanks";

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

export default function RSVPPageClient({ wedding, initialGroup }: RSVPPageClientProps) {
  const [view, setView] = useState<View>(initialGroup ? "form" : "search");
  const [group, setGroup] = useState<GroupPublicData | null>(initialGroup);
  const isPastDeadline = new Date(wedding.rsvpDeadline) < new Date();

  if (isPastDeadline) {
    return (
      <FadeIn direction="up">
        <div className="text-center py-12 space-y-4">
          <BotanicalOrnament className="w-20 text-gold/25 mx-auto" />
          <p className="font-serif text-2xl font-light text-navy">RSVP is now closed</p>
          <p className="text-sm text-navy/50 font-sans max-w-xs mx-auto leading-relaxed">
            Thank you to everyone who responded. We can&apos;t wait to celebrate.
          </p>
        </div>
      </FadeIn>
    );
  }

  return (
    <AnimatePresence mode="wait">

      {/* ── Search ── */}
      {view === "search" && (
        <motion.div
          key="search"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          transition={{ type: "spring", stiffness: 180, damping: 28 }}
          className="space-y-10"
        >
          <div className="text-center space-y-3">
            <p className="text-[10px] tracking-[0.38em] uppercase text-gold font-sans">
              You&apos;re invited
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-navy">
              Find your invitation
            </h2>
            <p className="text-sm text-navy/50 font-sans max-w-xs mx-auto leading-relaxed">
              Search for your name below to begin your RSVP.
            </p>
          </div>

          <div className="flex justify-center">
            <GuestSearch
              weddingId={wedding.id}
              onSelect={(g) => {
                setGroup(g);
                setView("form");
              }}
            />
          </div>

          <Divider />

          <p className="text-center text-xs text-navy/30 font-sans leading-relaxed">
            Received an email invitation?{" "}
            <span className="text-navy/50">
              Use the personal link in your email for a faster experience.
            </span>
          </p>
        </motion.div>
      )}

      {/* ── Form ── */}
      {view === "form" && group && (
        <motion.div
          key="form"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          transition={{ type: "spring", stiffness: 180, damping: 28 }}
        >
          {group.hasExistingResponse && (
            <div className="mb-8 px-5 py-4 border-l-2 border-gold bg-champagne/20 rounded-r-xl">
              <p className="text-xs font-sans text-navy/60 leading-relaxed">
                You&apos;ve already responded — you&apos;re welcome to update your RSVP below.
              </p>
            </div>
          )}
          <RSVPForm
            wedding={wedding}
            group={group}
            onComplete={() => setView("thanks")}
            onBack={() => {
              if (!initialGroup) {
                setGroup(null);
                setView("search");
              }
            }}
          />
        </motion.div>
      )}

      {/* ── Thanks ── */}
      {view === "thanks" && group && (
        <motion.div
          key="thanks"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 28 }}
          className="text-center py-10 space-y-8"
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.1 }}
          >
            <BotanicalOrnament className="w-28 text-gold/45 mx-auto" />
          </motion.div>

          <div className="space-y-3">
            <p className="text-[10px] tracking-[0.4em] uppercase text-gold font-sans">
              See you soon
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-navy">
              Thank you, {group.guests[0]?.firstName}!
            </h2>
            <p className="text-sm text-navy/50 font-sans max-w-xs mx-auto leading-relaxed">
              Your RSVP has been received. We are overjoyed that you&apos;ll be celebrating with us.
            </p>
          </div>

          <Divider diamond />

          <p className="text-xs tracking-[0.35em] uppercase text-navy/30 font-sans">
            {wedding.partner1Name} &amp; {wedding.partner2Name}
          </p>
        </motion.div>
      )}

    </AnimatePresence>
  );
}
