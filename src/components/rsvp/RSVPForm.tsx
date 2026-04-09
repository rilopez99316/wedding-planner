"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GuestGroup, EventKey, DietaryKey, DietarySelection, RSVPResponse } from "@/lib/types";
import { weddingConfig } from "@/config/wedding-config";
import Button from "@/components/ui/Button";
import DietarySelector from "./DietarySelector";
import Divider from "@/components/ui/Divider";
import Input from "@/components/ui/Input";

type Step = 1 | 2 | 3 | 4;

interface RSVPFormProps {
  group: GuestGroup;
  onComplete: (response: RSVPResponse) => void;
  onBack: () => void;
}

const slideVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export default function RSVPForm({ group, onComplete, onBack }: RSVPFormProps) {
  const [step, setStep] = useState<Step>(1);
  const [plusOneAttending, setPlusOneAttending] = useState(false);
  const [plusOneName, setPlusOneName] = useState(group.plusOneNameIfKnown ?? "");
  const [eventAttendance, setEventAttendance] = useState<Record<EventKey, boolean>>(
    () =>
      Object.fromEntries(
        group.allowedEvents.map((e) => [e, true])
      ) as Record<EventKey, boolean>
  );
  const [dietary, setDietary] = useState<Record<string, DietarySelection>>(() => {
    const init: Record<string, DietarySelection> = {};
    group.guests.forEach((g) => {
      init[g.id] = { guestId: g.id, restrictions: [], otherNotes: "" };
    });
    if (group.hasPlusOne) {
      init["plus-one"] = { guestId: "plus-one", restrictions: [], otherNotes: "" };
    }
    return init;
  });
  const [submitting, setSubmitting] = useState(false);

  function toggleEvent(key: EventKey) {
    setEventAttendance((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function updateDietary(guestId: string, restrictions: DietaryKey[], otherNotes: string) {
    setDietary((prev) => ({
      ...prev,
      [guestId]: { guestId, restrictions, otherNotes },
    }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000)); // simulate API call
    const response: RSVPResponse = {
      groupId: group.id,
      submittedAt: new Date(),
      plusOneAttending,
      plusOneName: plusOneAttending && group.hasPlusOne ? plusOneName : undefined,
      eventAttendance: group.allowedEvents.map((key) => ({
        eventKey: key,
        attending: eventAttendance[key] ?? false,
      })),
      dietary: Object.values(dietary).filter(
        (d) =>
          d.restrictions.length > 0 ||
          d.otherNotes.trim().length > 0
      ),
    };
    setSubmitting(false);
    onComplete(response);
  }

  const stepLabel = ["Confirm", "Events", "Dietary", "Review"];

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {stepLabel.map((label, i) => {
          const s = (i + 1) as Step;
          const done = step > s;
          const active = step === s;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-sans transition-colors duration-200 ${
                    done
                      ? "bg-gold text-ivory"
                      : active
                      ? "bg-navy text-ivory"
                      : "bg-navy/10 text-navy/30"
                  }`}
                >
                  {done ? "✓" : s}
                </div>
                <span
                  className={`text-xs mt-1 tracking-wider font-sans ${
                    active ? "text-navy" : "text-navy/30"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < stepLabel.length - 1 && (
                <div
                  className={`h-px w-8 mb-4 transition-colors duration-300 ${
                    done ? "bg-gold" : "bg-navy/10"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            className="space-y-6"
          >
            <div>
              <h2 className="font-serif text-2xl font-light text-navy">
                Is this your party?
              </h2>
              <p className="text-sm text-navy/50 mt-1 font-sans">
                Please confirm the guests in your group.
              </p>
            </div>
            <Divider />
            <div className="space-y-2">
              {group.guests.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center gap-3 px-4 py-3 border border-navy/10 bg-white/50"
                >
                  <span className="w-2 h-2 rounded-full bg-gold flex-shrink-0" />
                  <span className="font-serif text-base font-light text-navy">
                    {g.firstName} {g.lastName}
                  </span>
                </div>
              ))}
              {group.hasPlusOne && (
                <div className="space-y-3 mt-4">
                  <label className="flex items-center gap-3 px-4 py-3 border border-navy/10 bg-white/50 cursor-pointer hover:border-gold/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={plusOneAttending}
                      onChange={(e) => setPlusOneAttending(e.target.checked)}
                      className="sr-only"
                    />
                    <span
                      className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 transition-colors ${
                        plusOneAttending ? "border-gold bg-gold" : "border-navy/20"
                      }`}
                    >
                      {plusOneAttending && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="#FDFAF5" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      )}
                    </span>
                    <span className="font-serif text-base font-light text-navy/70">
                      + Guest
                    </span>
                  </label>
                  {plusOneAttending && !group.plusOneNameIfKnown && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.2 }}
                    >
                      <Input
                        label="Guest's full name"
                        placeholder="First and last name"
                        value={plusOneName}
                        onChange={(e) => setPlusOneName(e.target.value)}
                      />
                    </motion.div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={onBack} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(2)} className="flex-1">
                Confirm
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            className="space-y-6"
          >
            <div>
              <h2 className="font-serif text-2xl font-light text-navy">Which events?</h2>
              <p className="text-sm text-navy/50 mt-1 font-sans">
                Let us know which celebrations you&apos;ll be attending.
              </p>
            </div>
            <Divider />
            <div className="space-y-3">
              {group.allowedEvents.map((key) => {
                const event = weddingConfig.events[key];
                const attending = eventAttendance[key];
                return (
                  <label
                    key={key}
                    className={`flex items-center justify-between px-5 py-4 border cursor-pointer transition-all duration-150 ${
                      attending
                        ? "border-gold bg-champagne/20"
                        : "border-navy/10 bg-white/50 hover:border-gold/40"
                    }`}
                  >
                    <div>
                      <p className="font-serif text-base font-light text-navy">
                        {event.label}
                      </p>
                      <p className="text-xs text-navy/40 font-sans mt-0.5">
                        {event.date.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={attending}
                      onChange={() => toggleEvent(key)}
                      className="sr-only"
                    />
                    <span
                      className={`w-5 h-5 border flex items-center justify-center flex-shrink-0 transition-colors ${
                        attending ? "border-gold bg-gold" : "border-navy/20"
                      }`}
                    >
                      {attending && (
                        <svg width="12" height="9" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="#FDFAF5" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            className="space-y-8"
          >
            <div>
              <h2 className="font-serif text-2xl font-light text-navy">Dietary needs</h2>
              <p className="text-sm text-navy/50 mt-1 font-sans">
                Help us make sure everyone is taken care of.
              </p>
            </div>
            <Divider />
            {group.guests.map((guest, i) => (
              <div key={guest.id} className="space-y-4">
                {i > 0 && <Divider diamond />}
                <DietarySelector
                  guestName={`${guest.firstName} ${guest.lastName}`}
                  selected={dietary[guest.id]?.restrictions ?? []}
                  otherNotes={dietary[guest.id]?.otherNotes ?? ""}
                  onChange={(r, n) => updateDietary(guest.id, r, n)}
                />
              </div>
            ))}
            {group.hasPlusOne && plusOneAttending && (
              <div className="space-y-4">
                <Divider diamond />
                <DietarySelector
                  guestName={plusOneName || "Your Guest"}
                  selected={dietary["plus-one"]?.restrictions ?? []}
                  otherNotes={dietary["plus-one"]?.otherNotes ?? ""}
                  onChange={(r, n) => updateDietary("plus-one", r, n)}
                />
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(4)} className="flex-1">
                Review
              </Button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            className="space-y-6"
          >
            <div>
              <h2 className="font-serif text-2xl font-light text-navy">Review & submit</h2>
              <p className="text-sm text-navy/50 mt-1 font-sans">
                Please confirm your details before submitting.
              </p>
            </div>
            <Divider />

            {/* Guests */}
            <div className="space-y-1">
              <p className="text-xs tracking-widest uppercase text-navy/40 font-sans">Guests</p>
              {group.guests.map((g) => (
                <p key={g.id} className="font-serif text-base font-light text-navy">
                  {g.firstName} {g.lastName}
                </p>
              ))}
              {group.hasPlusOne && plusOneAttending && (
                <p className="font-serif text-base font-light text-navy">
                  {plusOneName || "Guest"}
                </p>
              )}
            </div>

            {/* Events */}
            <div className="space-y-1">
              <p className="text-xs tracking-widest uppercase text-navy/40 font-sans">Attending</p>
              {group.allowedEvents
                .filter((k) => eventAttendance[k])
                .map((k) => (
                  <p key={k} className="text-sm font-sans text-navy">
                    {weddingConfig.events[k].label}
                  </p>
                ))}
              {group.allowedEvents.every((k) => !eventAttendance[k]) && (
                <p className="text-sm font-sans text-navy/50 italic">Not attending any events</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => setStep(3)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleSubmit} loading={submitting} className="flex-1">
                Submit RSVP
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
