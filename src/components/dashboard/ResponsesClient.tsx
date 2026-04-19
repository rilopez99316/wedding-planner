"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import FadeIn from "@/components/ui/FadeIn";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RespondedGroup {
  id: string;
  groupName: string;
  attending: boolean;
  guestNames: string;
  plusOneLine: string | null;
  eventResponses: Array<{ key: string; label: string; attending: boolean }>;
  dietaryChips: string[];
  relativeTime: string;
}

export interface NotRespondedGroup {
  id: string;
  groupName: string;
  guestCount: number;
}

interface ResponsesClientProps {
  responded: RespondedGroup[];
  notResponded: NotRespondedGroup[];
  totalGroups: number;
  totalAttending: number;
  totalDeclined: number;
}

// ── Animated stat pill ────────────────────────────────────────────────────────

function StatPill({
  label,
  count,
  icon,
  color,
  delay,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  color: "rose" | "green" | "slate";
  delay: number;
}) {
  const count$ = useMotionValue(0);
  const rounded = useTransform(count$, Math.round);

  useEffect(() => {
    const controls = animate(count$, count, { duration: 0.9, ease: "easeOut" });
    return controls.stop;
  }, [count, count$]);

  const styles = {
    rose: {
      wrap: "bg-rose-50 border-rose-100",
      icon: "bg-rose-100 text-rose-400",
      num: "text-rose-500",
      label: "text-rose-400",
    },
    green: {
      wrap: "bg-emerald-50 border-emerald-100",
      icon: "bg-emerald-100 text-emerald-500",
      num: "text-emerald-600",
      label: "text-emerald-500",
    },
    slate: {
      wrap: "bg-slate-50 border-slate-100",
      icon: "bg-slate-100 text-slate-400",
      num: "text-slate-600",
      label: "text-slate-400",
    },
  }[color];

  return (
    <FadeIn direction="up" delay={delay}>
      <div className={cn("rounded-2xl border px-5 py-4 flex items-center gap-4 shadow-apple-sm", styles.wrap)}>
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", styles.icon)}>
          {icon}
        </div>
        <div>
          <motion.p className={cn("text-2xl font-semibold leading-none mb-0.5", styles.num)}>
            {rounded}
          </motion.p>
          <p className={cn("text-[11px] font-medium tracking-wide", styles.label)}>{label}</p>
        </div>
      </div>
    </FadeIn>
  );
}

// ── Event icon ────────────────────────────────────────────────────────────────

function EventIcon({ eventKey }: { eventKey: string }) {
  if (eventKey === "ceremony") {
    return (
      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    );
  }
  if (eventKey === "reception") {
    return (
      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  }
  if (eventKey === "rehearsal-dinner") {
    return (
      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    );
  }
  return (
    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ResponsesClient({
  responded,
  notResponded,
  totalGroups,
  totalAttending,
  totalDeclined,
}: ResponsesClientProps) {
  const [showNotResponded, setShowNotResponded] = useState(false);

  const respondedPct = totalGroups > 0 ? Math.round((responded.length / totalGroups) * 100) : 0;

  return (
    <div className="max-w-4xl space-y-6">

      {/* ── Stats row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatPill
          label="Groups responded"
          count={responded.length}
          delay={0}
          color="slate"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatPill
          label="Guests attending"
          count={totalAttending}
          delay={0.06}
          color="green"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
        />
        <StatPill
          label="Groups declined"
          count={totalDeclined}
          delay={0.12}
          color="rose"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
        />
      </div>

      {/* Response rate bar */}
      <FadeIn direction="up" delay={0.18}>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-violet-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #c4b5fd, #7c3aed)" }}
              initial={{ width: 0 }}
              animate={{ width: `${respondedPct}%` }}
              transition={{ duration: 1.1, ease: "easeOut", delay: 0.3 }}
            />
          </div>
          <span className="text-[11px] text-violet-500 font-medium tabular-nums shrink-0">
            {respondedPct}% responded
          </span>
        </div>
      </FadeIn>

      {/* ── Response cards / empty state ────────────────────────────────────── */}
      {responded.length === 0 ? (

        <FadeIn direction="up" delay={0.2}>
          <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-rose-100 bg-rose-50/30 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-300 mb-4">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <p className="text-[15px] font-semibold text-rose-400 mb-1">No responses yet</p>
            <p className="text-sm text-rose-300 max-w-xs leading-relaxed">
              Once guests submit their RSVPs, their responses will appear here.
            </p>
          </div>
        </FadeIn>

      ) : (

        <div className="space-y-3">
          {responded.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, type: "spring", stiffness: 220, damping: 26 }}
              whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(244,63,94,0.08), 0 2px 8px rgba(0,0,0,0.04)" }}
              className={cn(
                "rounded-2xl border shadow-apple-sm overflow-hidden cursor-default",
                group.attending
                  ? "bg-white border-emerald-100"
                  : "bg-white border-rose-100"
              )}
            >
              {/* Soft gradient header band */}
              <div
                className={cn(
                  "px-5 py-3 flex items-center justify-between",
                  group.attending
                    ? "bg-gradient-to-r from-emerald-50 to-white"
                    : "bg-gradient-to-r from-rose-50 to-white"
                )}
              >
                <div className="flex items-center gap-2.5">
                  {/* Status dot */}
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      group.attending ? "bg-emerald-400" : "bg-rose-400"
                    )}
                  />
                  <span className="text-[15px] font-semibold text-gray-800">{group.groupName}</span>
                  <Badge variant={group.attending ? "success" : "danger"}>
                    {group.attending ? "Attending" : "Declined"}
                  </Badge>
                </div>
                <span className="text-[11px] text-gray-400 tabular-nums shrink-0">{group.relativeTime}</span>
              </div>

              {/* Card body */}
              <div className="px-5 py-3.5">

                {/* Guest names */}
                <p className="text-[13px] text-gray-500 mb-3 leading-relaxed">
                  {group.guestNames}
                  {group.plusOneLine && (
                    <span className="text-gray-400"> · {group.plusOneLine}</span>
                  )}
                </p>

                {/* Event chips */}
                {group.eventResponses.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {group.eventResponses.map((er) => (
                      <span
                        key={er.key}
                        className={cn(
                          "inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2.5 py-0.5 border",
                          er.attending
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-gray-50 text-gray-400 border-gray-100 line-through"
                        )}
                      >
                        <EventIcon eventKey={er.key} />
                        {er.label}
                      </span>
                    ))}
                  </div>
                )}

                {/* Dietary chips */}
                {group.dietaryChips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {group.dietaryChips.map((d) => (
                      <span
                        key={d}
                        className="text-[11px] bg-amber-50 text-amber-600 border border-amber-100 rounded-full px-2.5 py-0.5 font-medium"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                )}

              </div>
            </motion.div>
          ))}
        </div>

      )}

      {/* ── Not responded collapsible ────────────────────────────────────────── */}
      {notResponded.length > 0 && (
        <div>
          <button
            onClick={() => setShowNotResponded(!showNotResponded)}
            className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-rose-400 transition-colors mb-3"
          >
            <motion.span
              animate={{ rotate: showNotResponded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="inline-block"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </motion.span>
            {notResponded.length} group{notResponded.length !== 1 ? "s" : ""} haven&apos;t responded yet
          </button>

          <AnimatePresence>
            {showNotResponded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="space-y-1.5">
                  {notResponded.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center gap-3 px-4 py-2.5 bg-rose-50/40 rounded-xl border border-rose-100/60"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-200 shrink-0" />
                      <span className="text-sm text-gray-500 flex-1">{g.groupName}</span>
                      <span className="text-xs text-gray-400">
                        {g.guestCount} guest{g.guestCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

    </div>
  );
}
