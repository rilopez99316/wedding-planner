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

export default function DeadlineCountdown({ rsvpDeadline, rsvpHref }: DeadlineCountdownProps) {
  const deadline = new Date(rsvpDeadline);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => getTimeLeft(deadline));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(deadline)), 1000);
    return () => clearInterval(id);
  }, [rsvpDeadline]);

  const isUrgent = timeLeft !== null && timeLeft.days < 7;

  if (timeLeft === null) {
    return (
      <div className="glass-card px-8 py-6 text-center">
        <p className="font-serif text-2xl text-navy font-light">RSVP is now closed</p>
        <p className="text-sm text-navy/50 mt-1 font-sans">
          Thank you to everyone who responded.
        </p>
      </div>
    );
  }

  return (
    <div className={`glass-card px-8 py-6 ${isUrgent ? "border-red-300/40" : ""}`}>
      <p className="text-xs tracking-widest uppercase text-center font-sans mb-4 text-navy/50">
        RSVP Deadline
      </p>
      <div className="flex items-start justify-center gap-6 md:gap-10">
        {[
          { value: timeLeft.days,    label: "Days" },
          { value: timeLeft.hours,   label: "Hours" },
          { value: timeLeft.minutes, label: "Min" },
          { value: timeLeft.seconds, label: "Sec" },
        ].map(({ value, label }) => (
          <div key={label} className="flex flex-col items-center">
            <motion.span
              key={value}
              initial={{ opacity: 0.4, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`font-serif text-4xl md:text-5xl font-light tabular-nums leading-none ${
                isUrgent ? "text-red-500" : "text-navy"
              }`}
            >
              {pad(value)}
            </motion.span>
            <span className="text-xs tracking-widest uppercase text-navy/40 mt-1 font-sans">
              {label}
            </span>
          </div>
        ))}
      </div>
      {isUrgent && (
        <motion.p
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-center text-xs text-red-500 mt-4 tracking-wider font-sans"
        >
          ◆ Deadline approaching — please respond soon
        </motion.p>
      )}
      {rsvpHref && (
        <div className="text-center mt-5">
          <Link
            href={rsvpHref}
            className="text-xs tracking-widest uppercase text-navy/60 border-b border-navy/20 hover:text-navy hover:border-navy/50 transition-colors pb-0.5 font-sans"
          >
            RSVP now
          </Link>
        </div>
      )}
    </div>
  );
}
