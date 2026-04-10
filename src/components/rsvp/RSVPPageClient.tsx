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

export default function RSVPPageClient({ wedding, initialGroup }: RSVPPageClientProps) {
  const [view, setView] = useState<View>(initialGroup ? "form" : "search");
  const [group, setGroup] = useState<GroupPublicData | null>(initialGroup);
  const isPastDeadline = new Date(wedding.rsvpDeadline) < new Date();

  if (isPastDeadline) {
    return (
      <FadeIn direction="up">
        <div className="glass-card px-8 py-10 text-center space-y-2">
          <p className="font-serif text-2xl font-light text-navy">RSVP is now closed</p>
          <p className="text-sm text-navy/50 font-sans">
            Thank you to everyone who responded.
          </p>
        </div>
      </FadeIn>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {view === "search" && (
        <motion.div
          key="search"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ type: "spring", stiffness: 180, damping: 28 }}
          className="space-y-8"
        >
          <div className="text-center space-y-2">
            <h2 className="font-serif text-2xl font-light text-navy">Find your invitation</h2>
            <p className="text-sm text-navy/50 font-sans">
              Search for your name to get started.
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

          <p className="text-center text-xs text-navy/30 font-sans">
            Received an email invitation?{" "}
            <span className="text-navy/50">Use the link in your email for a faster experience.</span>
          </p>
        </motion.div>
      )}

      {view === "form" && group && (
        <motion.div
          key="form"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ type: "spring", stiffness: 180, damping: 28 }}
        >
          {group.hasExistingResponse && (
            <div className="mb-6 px-5 py-3 border border-gold/30 bg-champagne/20 text-center">
              <p className="text-xs font-sans text-navy/60">
                You&apos;ve already responded — you can update your RSVP below.
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

      {view === "thanks" && group && (
        <motion.div
          key="thanks"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 28 }}
          className="text-center space-y-6 py-8"
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-gold/10 flex items-center justify-center">
            <svg width="24" height="20" viewBox="0 0 24 20" fill="none">
              <path
                d="M2 10L9 17L22 3"
                stroke="#C9A84C"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-3xl font-light text-navy">
              Thank you, {group.guests[0]?.firstName}!
            </h2>
            <p className="text-sm text-navy/50 font-sans">
              Your RSVP has been received. We look forward to celebrating with you.
            </p>
          </div>

          <Divider diamond />

          <p className="text-xs tracking-widest uppercase text-navy/30 font-sans">
            {wedding.partner1Name} &amp; {wedding.partner2Name}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
