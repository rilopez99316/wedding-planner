"use client";

import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

interface SeatingStatsBarProps {
  seatedCount:     number;
  totalCount:      number;
  onAutoAssign:    () => void;
  isAutoAssigning: boolean;
  onAddTable:      () => void;
}

export default function SeatingStatsBar({
  seatedCount,
  totalCount,
  onAutoAssign,
  isAutoAssigning,
  onAddTable,
}: SeatingStatsBarProps) {
  const fraction  = totalCount > 0 ? seatedCount / totalCount : 0;
  const pct       = Math.round(fraction * 100);
  const allSeated = seatedCount === totalCount && totalCount > 0;

  // SVG ring constants
  const r            = 26;
  const circumference = 2 * Math.PI * r;

  return (
    <div
      className="relative rounded-2xl shadow-apple-md px-6 py-5 mb-5 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 30%, #ffe4e6 60%, #fff7ed 100%)",
      }}
    >
      {/* Decorative blurred blobs */}
      <div
        className="absolute -top-8 -right-8 w-36 h-36 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, #fbcfe8 0%, transparent 70%)", opacity: 0.5 }}
        aria-hidden
      />
      <div
        className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, #ddd6fe 0%, transparent 70%)", opacity: 0.4 }}
        aria-hidden
      />

      <div className="relative flex items-center justify-between gap-4 flex-wrap">
        {/* Left: ring + copy */}
        <div className="flex items-center gap-4">
          {/* Circular progress ring */}
          <div className="relative flex-shrink-0 w-16 h-16">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64" aria-hidden>
              {/* Track */}
              <circle
                cx="32" cy="32" r={r}
                fill="none"
                stroke="#fce7f3"
                strokeWidth="6"
              />
              {/* Progress */}
              <circle
                cx="32" cy="32" r={r}
                fill="none"
                stroke={allSeated ? "#10b981" : "#f43f5e"}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - fraction)}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            {/* Percentage label in the center */}
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-rose-700">
              {pct}%
            </span>
          </div>

          {/* Animated copy — bounces when allSeated flips */}
          <AnimatePresence mode="wait">
            {allSeated ? (
              <motion.div
                key="all-seated"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
              >
                <p className="text-lg font-bold text-emerald-700">All Seated! 🥂</p>
                <p className="text-sm text-emerald-600 mt-0.5">
                  Every guest has a spot at your table
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="partial"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
              >
                <p className="text-lg font-bold text-rose-800">
                  {seatedCount}
                  <span className="text-rose-400 font-normal text-base"> / {totalCount}</span>
                </p>
                <p className="text-sm text-rose-500 mt-0.5">
                  {seatedCount === 0 && totalCount > 0
                    ? "Time to start seating your guests ✨"
                    : totalCount === 0
                    ? "Confirmed guests appear after RSVPs"
                    : "Your guests are finding their seats"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2">
          {/* Auto-Assign — gradient button */}
          <motion.button
            type="button"
            onClick={onAutoAssign}
            disabled={isAutoAssigning || totalCount === 0}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-apple-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            style={{ background: "linear-gradient(135deg, #f43f5e, #a855f7)" }}
          >
            {isAutoAssigning ? (
              <Spinner size="sm" />
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
            )}
            {isAutoAssigning ? "Assigning…" : "✨ Auto-Assign"}
          </motion.button>

          {/* Add Table */}
          <Button
            onClick={onAddTable}
            variant="secondary"
            className="flex items-center gap-1.5 bg-white/70 hover:bg-white border border-rose-100"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Table
          </Button>
        </div>
      </div>
    </div>
  );
}
