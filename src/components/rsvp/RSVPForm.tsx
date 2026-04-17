"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WeddingPublicData, GroupPublicData } from "./RSVPPageClient";
import { submitRsvpAction } from "@/lib/actions/rsvp";
import { DietaryKey, DietarySelection } from "@/lib/types";
import Button from "@/components/ui/Button";
import DietarySelector from "./DietarySelector";
import Divider from "@/components/ui/Divider";
import Input from "@/components/ui/Input";

type Step = 1 | 2 | 3 | 4;

interface RSVPFormProps {
  wedding: WeddingPublicData;
  group: GroupPublicData;
  onComplete: () => void;
  onBack: () => void;
}

const slideVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const STEP_LABELS = ["Confirm", "Events", "Dietary", "Review"];

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEP_LABELS.map((label, i) => {
        const s = (i + 1) as Step;
        const done   = step > s;
        const active = step === s;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className={[
                  "w-2.5 h-2.5 rounded-full border-2 transition-all duration-300",
                  done   ? "bg-gold border-gold scale-100"       : "",
                  active ? "bg-navy border-navy scale-125"        : "",
                  !done && !active ? "bg-transparent border-navy/20" : "",
                ].join(" ")}
              />
              <span
                className={`text-[10px] tracking-[0.22em] uppercase font-sans transition-colors duration-200 ${
                  active ? "text-navy" : done ? "text-gold" : "text-navy/25"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`w-12 md:w-20 h-px mx-1 mb-5 transition-colors duration-300 ${
                  done ? "bg-gold/50" : "bg-navy/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function GuestRow({ firstName, lastName }: { firstName: string; lastName: string }) {
  const initials = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase();
  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-xl border border-gold/15 bg-ivory">
      <div className="w-9 h-9 rounded-full bg-champagne flex items-center justify-center shrink-0">
        <span className="font-serif text-sm font-light text-navy/70">{initials}</span>
      </div>
      <span className="font-serif text-base font-light text-navy">
        {firstName} {lastName}
      </span>
    </div>
  );
}

export default function RSVPForm({ wedding, group, onComplete, onBack }: RSVPFormProps) {
  const [step, setStep] = useState<Step>(1);
  const [plusOneAttending, setPlusOneAttending] = useState(false);
  const [plusOneName, setPlusOneName] = useState(group.plusOneNameIfKnown ?? "");
  const [eventAttendance, setEventAttendance] = useState<Record<string, boolean>>(
    () => Object.fromEntries(group.allowedEventKeys.map((k) => [k, true]))
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
  const [error, setError] = useState<string | null>(null);

  function toggleEvent(key: string) {
    setEventAttendance((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function updateDietary(guestId: string, restrictions: DietaryKey[], otherNotes: string) {
    setDietary((prev) => ({ ...prev, [guestId]: { guestId, restrictions, otherNotes } }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await submitRsvpAction(group.id, wedding.id, {
        plusOneAttending,
        plusOneName: plusOneAttending ? plusOneName : undefined,
        eventAttendance: group.allowedEventKeys.map((key) => ({
          eventKey: key,
          attending: eventAttendance[key] ?? false,
        })),
        dietary: Object.values(dietary),
      });
      onComplete();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <StepIndicator step={step} />

      <AnimatePresence mode="wait">

        {/* ── Step 1: Confirm guests ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            className="space-y-7"
          >
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-light text-navy">
                Is this your party?
              </h2>
              <p className="text-sm text-navy/45 mt-1.5 font-sans leading-relaxed">
                Please confirm the guests in your group.
              </p>
            </div>

            <Divider />

            <div className="space-y-2.5">
              {group.guests.map((g) => (
                <GuestRow key={g.id} firstName={g.firstName} lastName={g.lastName} />
              ))}

              {group.hasPlusOne && (
                <div className="space-y-3 pt-1">
                  <label className="flex items-center gap-4 px-5 py-4 rounded-xl border border-navy/10 bg-ivory cursor-pointer hover:border-gold/40 transition-colors duration-200">
                    <input
                      type="checkbox"
                      checked={plusOneAttending}
                      onChange={(e) => setPlusOneAttending(e.target.checked)}
                      className="sr-only"
                    />
                    <span
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors duration-200 ${
                        plusOneAttending ? "border-gold bg-gold" : "border-navy/20"
                      }`}
                    >
                      {plusOneAttending && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="#FDFAF5" strokeWidth="1.75" strokeLinecap="round" />
                        </svg>
                      )}
                    </span>
                    <span className="font-serif text-base font-light text-navy/65">
                      {group.plusOneNameIfKnown ? group.plusOneNameIfKnown : "+ Guest"}
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

            <div className="flex gap-3 pt-1">
              <Button variant="ghost" onClick={onBack} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(2)} className="flex-1">
                Confirm
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Events ── */}
        {step === 2 && (
          <motion.div
            key="step2"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            className="space-y-7"
          >
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-light text-navy">
                Which events?
              </h2>
              <p className="text-sm text-navy/45 mt-1.5 font-sans leading-relaxed">
                Let us know which celebrations you&apos;ll be attending.
              </p>
            </div>

            <Divider />

            <div className="space-y-3">
              {group.allowedEventKeys.map((key) => {
                const event = wedding.events.find((e) => e.key === key);
                const attending = eventAttendance[key];
                return (
                  <label
                    key={key}
                    className={[
                      "flex items-center justify-between px-5 py-5 rounded-xl border cursor-pointer",
                      "transition-all duration-200",
                      attending
                        ? "border-gold/40 bg-champagne/25 shadow-apple-xs"
                        : "border-navy/10 bg-ivory hover:border-gold/30",
                    ].join(" ")}
                  >
                    <div>
                      <p className="font-serif text-lg font-light text-navy">
                        {event?.label ?? key}
                      </p>
                      {event && (
                        <p className="text-xs text-navy/40 font-sans mt-0.5">
                          {new Date(event.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={attending}
                      onChange={() => toggleEvent(key)}
                      className="sr-only"
                    />
                    <span
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors duration-200 ml-4 ${
                        attending ? "border-gold bg-gold" : "border-navy/20"
                      }`}
                    >
                      {attending && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="#FDFAF5" strokeWidth="1.75" strokeLinecap="round" />
                        </svg>
                      )}
                    </span>
                  </label>
                );
              })}

              {group.allowedEventKeys.length === 0 && (
                <p className="text-sm text-navy/40 font-sans text-center py-6">
                  You&apos;re invited to all celebrations.
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Dietary ── */}
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
              <h2 className="font-serif text-2xl md:text-3xl font-light text-navy">
                Dietary needs
              </h2>
              <p className="text-sm text-navy/45 mt-1.5 font-sans leading-relaxed">
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
                  guestName={plusOneName || group.plusOneNameIfKnown || "Your Guest"}
                  selected={dietary["plus-one"]?.restrictions ?? []}
                  otherNotes={dietary["plus-one"]?.otherNotes ?? ""}
                  onChange={(r, n) => updateDietary("plus-one", r, n)}
                />
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(4)} className="flex-1">
                Review
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Step 4: Review & submit ── */}
        {step === 4 && (
          <motion.div
            key="step4"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
            className="space-y-7"
          >
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-light text-navy">
                Review &amp; submit
              </h2>
              <p className="text-sm text-navy/45 mt-1.5 font-sans leading-relaxed">
                Please confirm your details before submitting.
              </p>
            </div>

            <Divider />

            {/* Summary card */}
            <div className="rounded-2xl border border-gold/15 bg-champagne/15 overflow-hidden divide-y divide-gold/10">
              {/* Guests */}
              <div className="px-6 py-5 space-y-2">
                <p className="text-[10px] tracking-[0.28em] uppercase text-gold font-sans">Guests</p>
                {group.guests.map((g) => (
                  <p key={g.id} className="font-serif text-base font-light text-navy">
                    {g.firstName} {g.lastName}
                  </p>
                ))}
                {group.hasPlusOne && plusOneAttending && (
                  <p className="font-serif text-base font-light text-navy">
                    {plusOneName || group.plusOneNameIfKnown || "Guest"}
                  </p>
                )}
              </div>

              {/* Events */}
              <div className="px-6 py-5 space-y-2">
                <p className="text-[10px] tracking-[0.28em] uppercase text-gold font-sans">Attending</p>
                {group.allowedEventKeys.filter((k) => eventAttendance[k]).length > 0 ? (
                  group.allowedEventKeys
                    .filter((k) => eventAttendance[k])
                    .map((k) => {
                      const event = wedding.events.find((e) => e.key === k);
                      return (
                        <p key={k} className="text-sm font-sans text-navy/80">
                          {event?.label ?? k}
                        </p>
                      );
                    })
                ) : (
                  <p className="text-sm font-sans text-navy/40 italic">
                    Not attending any events
                  </p>
                )}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 font-sans text-center">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
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
