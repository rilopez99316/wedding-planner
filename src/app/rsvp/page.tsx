"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GuestSearch from "@/components/rsvp/GuestSearch";
import RSVPForm from "@/components/rsvp/RSVPForm";
import DeadlineCountdown from "@/components/rsvp/DeadlineCountdown";
import FadeIn from "@/components/ui/FadeIn";
import Divider from "@/components/ui/Divider";
import { GuestGroup, RSVPResponse } from "@/lib/types";
import { weddingConfig } from "@/config/wedding-config";

type Stage = "search" | "form" | "thankyou";

export default function RSVPPage() {
  const [stage, setStage] = useState<Stage>("search");
  const [selectedGroup, setSelectedGroup] = useState<GuestGroup | null>(null);

  function handleSelect(group: GuestGroup) {
    setSelectedGroup(group);
    setStage("form");
  }

  function handleComplete(_response: RSVPResponse) {
    setStage("thankyou");
  }

  function handleBack() {
    setSelectedGroup(null);
    setStage("search");
  }

  return (
    <div className="min-h-screen bg-ivory">
      {/* Page header */}
      <div className="bg-champagne/20 border-b border-gold/10 py-14 px-6 text-center">
        <FadeIn direction="up">
          <p className="text-xs tracking-[0.3em] uppercase text-gold font-sans mb-3">
            {weddingConfig.couple.displayNames}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-light text-navy">
            RSVP
          </h1>
        </FadeIn>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-14 space-y-10">
        {/* Countdown — always visible */}
        <FadeIn direction="up">
          <DeadlineCountdown />
        </FadeIn>

        <FadeIn direction="up" delay={0.1}>
          <Divider diamond />
        </FadeIn>

        <AnimatePresence mode="wait">
          {stage === "search" && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ type: "spring", stiffness: 200, damping: 30 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="font-serif text-2xl font-light text-navy">
                  Find your invitation
                </h2>
                <p className="text-sm text-navy/50 font-sans">
                  Search by your name or family group to begin your RSVP.
                </p>
              </div>
              <div className="flex justify-center">
                <GuestSearch onSelect={handleSelect} />
              </div>
            </motion.div>
          )}

          {stage === "form" && selectedGroup && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ type: "spring", stiffness: 200, damping: 30 }}
            >
              <RSVPForm
                group={selectedGroup}
                onComplete={handleComplete}
                onBack={handleBack}
              />
            </motion.div>
          )}

          {stage === "thankyou" && (
            <motion.div
              key="thankyou"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              className="text-center space-y-6 py-10"
            >
              <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto">
                <svg width="24" height="20" viewBox="0 0 24 20" fill="none">
                  <path
                    d="M2 10L8.5 16.5L22 2"
                    stroke="#C9A84C"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h2 className="font-serif text-3xl font-light text-navy">
                  Thank you
                </h2>
                <p className="text-sm text-navy/50 font-sans mt-2 leading-relaxed">
                  Your RSVP has been received. We look forward to celebrating with you.
                </p>
              </div>
              <Divider diamond className="max-w-xs mx-auto" />
              <p className="font-serif text-lg font-light text-navy/60 italic">
                With love, {weddingConfig.couple.displayNames}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
