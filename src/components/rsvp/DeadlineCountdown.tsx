"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface DeadlineCountdownProps {
  rsvpDeadline: Date | string;
  rsvpHref?: string;
  dark?: boolean;
}

function getTimeLeft(deadline: Date): TimeLeft | null {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function DeadlineCountdown({ rsvpDeadline, rsvpHref, dark = false }: DeadlineCountdownProps) {
  const deadline = new Date(rsvpDeadline);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => getTimeLeft(deadline));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(deadline)), 1000);
    return () => clearInterval(id);
  }, [rsvpDeadline]);

  const isUrgent = timeLeft !== null && timeLeft.days < 7;

  const numColor   = dark ? "text-white" : "text-navy";
  const labelColor = dark ? "text-white/35" : "text-navy/35";
  const divColor   = dark ? "bg-white/10"  : "bg-gold/20";

  if (timeLeft === null) {
    return (
      <div className="text-center space-y-2">
        <p className={`font-serif text-2xl font-light ${numColor}`}>RSVP is now closed</p>
        <p className={`text-sm font-sans ${labelColor}`}>Thank you to everyone who responded.</p>
      </div>
    );
  }

  const units = [
    { value: timeLeft.days,    label: "Days" },
    { value: timeLeft.hours,   label: "Hours" },
    { value: timeLeft.minutes, label: "Min" },
    { value: timeLeft.seconds, label: "Sec" },
  ];

  return (
    <div className="text-center space-y-8">
      <p className="text-[10px] tracking-[0.42em] uppercase font-sans text-gold">
        {isUrgent ? "Deadline approaching" : "RSVP Deadline"}
      </p>

      <div className="flex items-center justify-center">
        {units.map(({ value, label }, i) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center px-5 md:px-9">
              <motion.span
                key={value}
                initial={{ opacity: 0.3, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className={`font-serif font-light tabular-nums leading-none ${
                  isUrgent ? "text-gold" : numColor
                }`}
                style={{ fontSize: "clamp(2.75rem, 6vw, 4.75rem)" }}
              >
                {pad(value)}
              </motion.span>
              <span className={`text-[10px] tracking-[0.32em] uppercase mt-2.5 font-sans ${labelColor}`}>
                {label}
              </span>
            </div>
            {i < units.length - 1 && (
              <div className={`w-px h-10 self-center ${divColor}`} />
            )}
          </div>
        ))}
      </div>

      {isUrgent && (
        <motion.p
          animate={{ opacity: [1, 0.45, 1] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          className="text-[10px] tracking-[0.32em] uppercase text-gold font-sans"
        >
          ◆ Please respond soon
        </motion.p>
      )}

      {rsvpHref && (
        <div>
          <Link
            href={rsvpHref}
            className={`inline-flex items-center gap-3 px-10 py-4 text-[10px] tracking-[0.3em] uppercase font-sans border transition-all duration-300 ${
              dark
                ? "border-white/30 text-white hover:bg-white hover:text-navy"
                : "border-navy/25 text-navy hover:bg-navy hover:text-ivory"
            }`}
          >
            Kindly RSVP
          </Link>
        </div>
      )}
    </div>
  );
}
