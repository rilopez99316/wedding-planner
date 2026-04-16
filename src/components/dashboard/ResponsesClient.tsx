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

// ── Animated stat tile ────────────────────────────────────────────────────────

function AnimatedStatTile({
  label,
  count,
  sublabel,
  color,
  delay,
}: {
  label: string;
  count: number;
  sublabel?: string;
  color: "gray" | "green" | "red";
  delay: number;
}) {
  const count$ = useMotionValue(0);
  const rounded = useTransform(count$, Math.round);

  useEffect(() => {
    const controls = animate(count$, count, { duration: 0.8, ease: "easeOut" });
    return controls.stop;
  }, [count, count$]);

  const colorMap = {
    gray: "bg-white border-gray-100",
    green: "bg-green-50 border-green-100",
    red: "bg-red-50 border-red-100",
  };
  const numberColor = {
    gray: "text-gray-900",
    green: "text-green-800",
    red: "text-red-700",
  };

  return (
    <FadeIn direction="up" delay={delay}>
      <div className={cn("rounded-xl border shadow-apple-sm px-4 py-4", colorMap[color])}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">{label}</p>
        <motion.p className={cn("text-3xl font-semibold", numberColor[color])}>
          {rounded}
        </motion.p>
        {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
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
  // farewell-brunch or fallback
  return (
    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

// ── Chevron icon ──────────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={cn("w-4 h-4 transition-transform duration-200", open && "rotate-180")}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
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

  return (
    <div className="max-w-4xl space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AnimatedStatTile
          label="Groups Responded"
          count={responded.length}
          sublabel={`of ${totalGroups} total`}
          color="gray"
          delay={0}
        />
        <AnimatedStatTile
          label="Attending"
          count={totalAttending}
          sublabel="guests"
          color="green"
          delay={0.05}
        />
        <AnimatedStatTile
          label="Declined"
          count={totalDeclined}
          sublabel="groups"
          color="red"
          delay={0.1}
        />
      </div>

      {/* Response cards */}
      {responded.length === 0 ? (
        <FadeIn direction="up" delay={0.15}>
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[15px] font-semibold text-gray-800 mb-1">No responses yet</p>
            <p className="text-sm text-gray-400 max-w-xs">
              Once guests submit their RSVPs, their responses will appear here.
            </p>
          </div>
        </FadeIn>
      ) : (
        <div className="space-y-3">
          {responded.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, type: "spring", stiffness: 200, damping: 28 }}
              className="bg-white rounded-xl border border-gray-100 shadow-apple-sm overflow-hidden flex"
            >
              {/* Left accent stripe */}
              <div className={cn("w-1 shrink-0", group.attending ? "bg-green-500" : "bg-red-400")} />

              {/* Card body */}
              <div className="flex-1 px-5 py-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[15px] font-semibold text-gray-900">{group.groupName}</span>
                    <Badge variant={group.attending ? "success" : "danger"}>
                      {group.attending ? "Attending" : "Declined"}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 mt-0.5">{group.relativeTime}</span>
                </div>

                {/* Guest names */}
                <p className="text-xs text-gray-400 mb-2.5">
                  {group.guestNames}
                  {group.plusOneLine && (
                    <span className="text-gray-300"> · {group.plusOneLine}</span>
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
                            ? "bg-green-50 text-green-700 border-green-100"
                            : "bg-gray-100 text-gray-400 border-gray-200 line-through"
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
                        className="text-[11px] bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-2.5 py-0.5 font-medium"
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

      {/* Not responded collapsible */}
      {notResponded.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowNotResponded(!showNotResponded)}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors mb-3"
          >
            <ChevronIcon open={showNotResponded} />
            {notResponded.length} group{notResponded.length !== 1 ? "s" : ""} haven&apos;t responded yet
          </button>

          <AnimatePresence>
            {showNotResponded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-1.5">
                  {notResponded.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-lg border border-gray-100"
                    >
                      <div className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                      <span className="text-sm text-gray-600 flex-1">{g.groupName}</span>
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
