"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import AddChecklistItemDialog from "@/components/dashboard/AddChecklistItemDialog";
import {
  toggleChecklistItemAction,
  deleteChecklistItemAction,
} from "@/lib/actions/checklist";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_EMOJIS,
  getProgressMessage,
} from "@/lib/checklist-constants";
import type { ChecklistItem } from "@prisma/client";

// ── Types ──────────────────────────────────────────────────────────────────

interface ChecklistClientProps {
  weddingId:     string;
  weddingDate:   Date;
  items:         ChecklistItem[];
  categoryOrder: string[];
}

type Filter = "all" | "incomplete" | "complete";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatShortDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(date));
}

// ── Circular progress ring ─────────────────────────────────────────────────

function CircularProgress({ pct, color, size = 26 }: { pct: number; color: string; size?: number }) {
  const r    = (size - 5) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0 -rotate-90"
      aria-hidden
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </svg>
  );
}

// ── Sparkle burst on check ─────────────────────────────────────────────────

function Sparkles({ color }: { color: string }) {
  const particles = [
    { angle: 0,   dist: 14 },
    { angle: 60,  dist: 12 },
    { angle: 120, dist: 14 },
    { angle: 180, dist: 12 },
    { angle: 240, dist: 14 },
    { angle: 300, dist: 12 },
  ];
  return (
    <span className="absolute inset-0 pointer-events-none" aria-hidden>
      {particles.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180;
        const x = Math.cos(rad) * p.dist;
        const y = Math.sin(rad) * p.dist;
        return (
          <motion.span
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              backgroundColor: color,
              top: "50%",
              left: "50%",
              marginTop: -2,
              marginLeft: -2,
            }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{ x, y, scale: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: i * 0.02 }}
          />
        );
      })}
    </span>
  );
}

// ── Confetti ───────────────────────────────────────────────────────────────

interface ParticleConfig {
  id:       number;
  x:        number;
  size:     number;
  color:    string;
  shape:    "circle" | "rect";
  duration: number;
  delay:    number;
  drift:    number;
  rotate:   number;
}

function ConfettiParticle({ p }: { p: ParticleConfig }) {
  const borderRadius = p.shape === "circle" ? "50%" : "3px";
  const width        = p.shape === "rect" ? p.size * 0.55 : p.size;
  return (
    <motion.span
      aria-hidden
      style={{
        position:        "fixed",
        top:             -p.size,
        left:            `${p.x}vw`,
        width,
        height:          p.size,
        borderRadius,
        backgroundColor: p.color,
        pointerEvents:   "none",
        zIndex:          60,
      }}
      initial={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
      animate={{ y: "105vh", x: p.drift, rotate: p.rotate, opacity: [1, 1, 1, 0] }}
      transition={{
        duration: p.duration,
        delay:    p.delay,
        ease:     [0.25, 0.46, 0.45, 0.94],
        opacity:  { times: [0, 0.6, 0.8, 1], duration: p.duration, delay: p.delay },
      }}
    />
  );
}

const CONFETTI_COLORS = [
  "#c9a84c", "#f59e0b", "#fbbf24", "#10b981",
  "#ec4899", "#8b5cf6", "#3b82f6", "#f97316", "#ffffff",
];

function ConfettiCanvas({ active }: { active: boolean }) {
  const particles = useMemo<ParticleConfig[]>(() =>
    Array.from({ length: 36 }, (_, i) => ({
      id:       i,
      x:        Math.random() * 98 + 1,
      size:     Math.floor(Math.random() * 10) + 5,
      color:    CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      shape:    (Math.random() > 0.45 ? "rect" : "circle") as "rect" | "circle",
      duration: Math.random() * 2.5 + 3,
      delay:    Math.random() * 1.5,
      drift:    (Math.random() - 0.5) * 120,
      rotate:   (Math.random() - 0.5) * 720,
    })),
  []);

  return (
    <AnimatePresence>
      {active && particles.map((p) => <ConfettiParticle key={p.id} p={p} />)}
    </AnimatePresence>
  );
}

// ── Celebration overlay ────────────────────────────────────────────────────

function CelebrationOverlay({ onDismiss }: { onDismiss: () => void }) {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowHint(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const circumference = 2 * Math.PI * 22;

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-50 px-4"
      style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onClick={onDismiss}
    >
      {/* Scrim */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Card */}
      <motion.div
        className="relative z-10 w-full max-w-sm bg-white rounded-2xl overflow-hidden"
        style={{
          boxShadow:
            "0 0 0 1.5px #c9a84c33, 0 0 0 3px #f59e0b18, 0 32px 64px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10)",
        }}
        initial={{ scale: 0.88, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        transition={{ type: "spring", stiffness: 380, damping: 28, delay: 0.1 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold top stripe */}
        <div
          className="h-1 w-full"
          style={{
            background: "linear-gradient(90deg, #c9a84c, #f59e0b, #fbbf24, #f59e0b, #c9a84c)",
          }}
        />

        <div className="px-8 pt-8 pb-7 flex flex-col items-center text-center gap-5">

          {/* Animated checkmark circle */}
          <div className="relative w-20 h-20">
            {/* Pulsing outer ring */}
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ border: "2px solid #f59e0b" }}
              animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Gold circle */}
            <div
              className="absolute inset-0 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #c9a84c 0%, #fbbf24 50%, #f59e0b 100%)" }}
            >
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <motion.path
                  d="M8 19 L15 26 L28 11"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.65, delay: 0.45, ease: "easeOut" }}
                />
              </svg>
            </div>
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h2
              className="font-serif text-2xl leading-tight"
              style={{ color: "#1a1a1a", letterSpacing: "-0.01em" }}
            >
              You&apos;re completely ready!
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed max-w-[260px]">
              Every detail is in place. The best day of your lives is almost here.
            </p>
          </div>

          {/* Countdown ring + close button */}
          <div className="relative">
            <svg
              width="52"
              height="52"
              viewBox="0 0 52 52"
              className="absolute inset-0 -rotate-90"
              aria-hidden
            >
              <circle cx="26" cy="26" r="22" fill="none" stroke="#f3f4f6" strokeWidth="2.5" />
              <motion.circle
                cx="26"
                cy="26"
                r="22"
                fill="none"
                stroke="#c9a84c"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: circumference }}
                transition={{ duration: 5.6, ease: "linear", delay: 0.2 }}
              />
            </svg>
            <button
              onClick={onDismiss}
              aria-label="Close celebration"
              className="relative w-[52px] h-[52px] rounded-full flex items-center justify-center"
              style={{ color: "#c9a84c" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Dismiss hint */}
          <AnimatePresence>
            {showHint && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-xs text-gray-400 tracking-wide"
              >
                Tap anywhere to continue
              </motion.p>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Milestone row (completed category strip) ───────────────────────────────

interface MilestoneRowProps {
  label:      string;
  emoji:      string;
  color:      string;
  total:      number;
  items:      ChecklistItem[];
  forceOpen:  boolean;
  onToggle:   (id: string, wasComplete: boolean) => void;
  togglingId: string | null;
}

function MilestoneRow({ label, emoji, color, total, items, forceOpen, onToggle, togglingId }: MilestoneRowProps) {
  const [expanded, setExpanded] = useState(false);
  const isOpen = forceOpen || expanded;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
      className="bg-white rounded-xl border border-gray-100 shadow-apple-xs overflow-hidden"
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50/60 transition-colors"
      >
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-base shrink-0 leading-none">{emoji}</span>
        <span className="flex-1 text-sm font-serif text-gray-600">{label}</span>
        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
          {total}/{total} ✦
        </span>
        <motion.svg
          animate={{ rotate: isOpen ? 0 : -90 }}
          transition={{ duration: 0.18 }}
          className="w-3.5 h-3.5 text-gray-300 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden border-t border-gray-50"
          >
            <ul className="divide-y divide-gray-50">
              {items.map((item) => {
                const isToggling = togglingId === item.id;
                return (
                  <li key={item.id} className="group flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/50 transition-colors">
                    {/* Toggleable checkbox */}
                    <button
                      onClick={() => onToggle(item.id, true)}
                      disabled={isToggling}
                      aria-label="Mark incomplete"
                      className="shrink-0 relative w-[20px] h-[20px] focus:outline-none disabled:cursor-wait"
                    >
                      <motion.span
                        animate={{ scale: isToggling ? 0.8 : 1 }}
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        className="absolute inset-0 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: color }}
                      >
                        {isToggling ? (
                          <svg className="w-2 h-2 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </motion.span>
                    </button>
                    <span className="flex-1 text-xs text-gray-400 line-through">{item.title}</span>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ChecklistClient({
  items,
  categoryOrder,
}: ChecklistClientProps) {
  const router = useRouter();

  const [filter, setFilter]                 = useState<Filter>("all");
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(categoryOrder));
  const [togglingId, setTogglingId]         = useState<string | null>(null);
  const [justCheckedId, setJustCheckedId]   = useState<string | null>(null);
  const [deletingId, setDeletingId]         = useState<string | null>(null);
  const [dialogOpen, setDialogOpen]         = useState(false);
  const [dialogDefaultCategory, setDialogDefaultCategory] = useState(categoryOrder[0] ?? "");
  const [error, setError]                   = useState<string | null>(null);
  const [celebrating, setCelebrating]             = useState(false);
  const [completedSectionOpen, setCompletedSectionOpen] = useState(true);

  // ── Derived ───────────────────────────────────────────────────────────────

  const totalCount     = items.length;
  const completedCount = items.filter((i) => i.completedAt !== null).length;
  const pct            = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // ── Celebration trigger ───────────────────────────────────────────────────
  const prevPctRef = useRef<number>(pct);

  useEffect(() => {
    if (pct === 100 && prevPctRef.current < 100) {
      setCelebrating(true);
      const t = setTimeout(() => setCelebrating(false), 6000);
      return () => clearTimeout(t);
    }
    prevPctRef.current = pct;
  }, [pct]);

  const grouped = categoryOrder.reduce<Record<string, ChecklistItem[]>>((acc, key) => {
    acc[key] = items.filter((i) => i.category === key);
    return acc;
  }, {});

  // Active = has any incomplete item (or no items yet). Completed = all items done.
  const activeCategories    = categoryOrder.filter((key) => {
    const all = grouped[key] ?? [];
    return all.length === 0 || all.some((i) => i.completedAt === null);
  });
  const completedCategories = categoryOrder.filter((key) => {
    const all = grouped[key] ?? [];
    return all.length > 0 && all.every((i) => i.completedAt !== null);
  });

  function getFilteredItems(key: string): ChecklistItem[] {
    return grouped[key].filter((item) => {
      if (filter === "incomplete") return item.completedAt === null;
      if (filter === "complete")   return item.completedAt !== null;
      return true;
    });
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleToggle(id: string, wasComplete: boolean) {
    setTogglingId(id);
    setError(null);
    try {
      await toggleChecklistItemAction(id);
      if (!wasComplete) {
        setJustCheckedId(id);
        setTimeout(() => setJustCheckedId(null), 600);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update task.");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this custom task?")) return;
    setDeletingId(id);
    setError(null);
    try {
      await deleteChecklistItemAction(id);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete task.");
    } finally {
      setDeletingId(null);
    }
  }

  function toggleAccordion(key: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function openAddDialog(category: string) {
    setDialogDefaultCategory(category);
    setDialogOpen(true);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl space-y-4">

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="shrink-0 text-red-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Progress hero ─────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl border border-amber-100"
        style={{
          background: "linear-gradient(135deg, #fffbf0 0%, #fff5e6 50%, #fef9f0 100%)",
        }}
      >
        {/* Decorative rings */}
        <span className="absolute -top-6 -right-6 w-32 h-32 rounded-full border border-amber-200/40 pointer-events-none" />
        <span className="absolute -top-3 -right-3 w-20 h-20 rounded-full border border-amber-200/30 pointer-events-none" />
        <span className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full border border-amber-100/50 pointer-events-none" />

        {/* Shimmer sweep at 100% */}
        {pct === 100 && (
          <motion.span
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%)",
              backgroundSize: "200% 100%",
            }}
            initial={{ backgroundPosition: "-100% 0" }}
            animate={{ backgroundPosition: "200% 0" }}
            transition={{
              duration:    2.2,
              delay:       0.5,
              ease:        "easeInOut",
              repeat:      Infinity,
              repeatDelay: 3.5,
            }}
          />
        )}

        <div className="relative px-6 py-5 flex items-center gap-5">
          {/* Percentage ring */}
          <div className="shrink-0 flex flex-col items-center gap-0.5">
            <p className="text-5xl font-bold leading-none tabular-nums" style={{
              color: "#c9a84c",
              textShadow: pct === 100
                ? "0 0 20px rgba(201,168,76,0.5), 0 0 40px rgba(245,158,11,0.25)"
                : "none",
              transition: "text-shadow 0.8s ease",
            }}>
              {pct}
              <span className="text-2xl font-medium text-amber-300">%</span>
            </p>
            <p className="text-[11px] font-medium text-amber-400/80 uppercase tracking-wider">done</p>
          </div>

          {/* Divider */}
          <div className="w-px h-14 bg-amber-200/60 shrink-0" />

          {/* Text + bar */}
          <div className="flex-1 min-w-0">
            <p className="font-serif text-lg text-amber-900/80 leading-tight mb-1">
              {getProgressMessage(pct)}
            </p>
            <p className="text-xs text-amber-600/60 mb-3">
              {completedCount} of {totalCount} tasks complete · {totalCount - completedCount} remaining
            </p>
            {/* Progress bar */}
            <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: pct === 100
                    ? "linear-gradient(90deg, #10b981, #34d399)"
                    : "linear-gradient(90deg, #c9a84c, #f59e0b, #fbbf24)",
                }}
                initial={{ width: 0 }}
                animate={{
                  width: `${pct}%`,
                  ...(pct === 100 && { scaleY: [1, 1.4, 1] }),
                }}
                transition={{
                  width:  { duration: 0.7, ease: "easeOut" },
                  scaleY: { duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.8 },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter tabs ───────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {(["all", "incomplete", "complete"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 capitalize",
              filter === f
                ? "bg-white text-gray-900 shadow-apple-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Active category accordions ────────────────────────────── */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {activeCategories.map((key) => {
            const allItems      = grouped[key] ?? [];
            const filteredItems = getFilteredItems(key);
            const catCompleted  = allItems.filter((i) => i.completedAt !== null).length;
            const catTotal      = allItems.length;
            const catPct        = catTotal > 0 ? Math.round((catCompleted / catTotal) * 100) : 0;
            const isOpen        = openCategories.has(key);
            const label         = CATEGORY_LABELS[key] ?? key;
            const color         = CATEGORY_COLORS[key] ?? "#6b7280";
            const emoji         = CATEGORY_EMOJIS[key] ?? "✦";

            return (
              <motion.div
                key={key}
                layout
                exit={{ opacity: 0, x: 40, scale: 0.96 }}
                transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
                className="relative bg-white rounded-2xl border border-gray-100 shadow-apple-sm overflow-hidden"
              >
                {/* Left accent bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3px]"
                  style={{ backgroundColor: color }}
                />

                {/* Category header */}
                <button
                  onClick={() => toggleAccordion(key)}
                  className="w-full flex items-center gap-3 pl-6 pr-5 py-3.5 text-left hover:bg-gray-50/70 transition-colors"
                >
                  <span className="text-xl shrink-0 leading-none">{emoji}</span>
                  <span className="flex-1 font-serif text-base text-gray-800">{label}</span>
                  <span className="text-xs font-medium text-gray-400 shrink-0 tabular-nums">
                    {catCompleted}/{catTotal}
                  </span>
                  <CircularProgress pct={catPct} color={color} />
                  <motion.svg
                    animate={{ rotate: isOpen ? 0 : -90 }}
                    transition={{ duration: 0.2 }}
                    className="w-4 h-4 shrink-0 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </button>

                {/* Accordion body */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-gray-100">
                        {filteredItems.length === 0 ? (
                          <p className="px-5 py-5 text-sm text-gray-400 text-center italic">
                            {filter === "all"
                              ? "No tasks here."
                              : `No ${filter} tasks in this section.`}
                          </p>
                        ) : (
                          <ul>
                            {filteredItems.map((item, idx) => {
                              const isComplete = item.completedAt !== null;
                              const isToggling = togglingId === item.id;
                              const isDeleting = deletingId === item.id;
                              const showSparks = justCheckedId === item.id;

                              return (
                                <motion.li
                                  key={item.id}
                                  layout
                                  className={cn(
                                    "group flex items-center gap-3.5 px-5 py-3.5 transition-colors duration-100",
                                    idx !== filteredItems.length - 1 && "border-b border-gray-50",
                                    isComplete ? "bg-gray-50/30" : "hover:bg-gray-50/50"
                                  )}
                                >
                                  {/* Animated checkbox */}
                                  <button
                                    onClick={() => handleToggle(item.id, isComplete)}
                                    disabled={isToggling}
                                    aria-label={isComplete ? "Mark incomplete" : "Mark complete"}
                                    className="shrink-0 relative w-[22px] h-[22px] focus:outline-none disabled:cursor-wait"
                                  >
                                    <AnimatePresence>
                                      {showSparks && <Sparkles key="sparks" color={color} />}
                                    </AnimatePresence>
                                    <motion.span
                                      animate={{ scale: isToggling ? 0.8 : isComplete ? 1.05 : 1 }}
                                      whileHover={{ scale: 1.1 }}
                                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                      className="absolute inset-0 rounded-full border-2 flex items-center justify-center"
                                      style={{
                                        borderColor:     isComplete ? color : "#d1d5db",
                                        backgroundColor: isComplete ? color : "transparent",
                                      }}
                                    >
                                      <AnimatePresence>
                                        {isComplete && (
                                          <motion.svg
                                            key="check"
                                            initial={{ scale: 0, rotate: -20 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            exit={{ scale: 0 }}
                                            transition={{ type: "spring", stiffness: 600, damping: 25 }}
                                            className="w-2.5 h-2.5 text-white"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={3}
                                          >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                          </motion.svg>
                                        )}
                                      </AnimatePresence>
                                    </motion.span>
                                  </button>

                                  {/* Title */}
                                  <span className={cn(
                                    "flex-1 text-sm leading-snug transition-all duration-200",
                                    isComplete ? "line-through text-gray-400" : "text-gray-800"
                                  )}>
                                    {item.title}
                                  </span>

                                  {/* Due date chip */}
                                  {item.dueDate && (
                                    <span
                                      className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full hidden sm:block transition-colors"
                                      style={{
                                        backgroundColor: isComplete ? "#f3f4f6" : `${color}18`,
                                        color:           isComplete ? "#9ca3af" : color,
                                      }}
                                    >
                                      {formatShortDate(item.dueDate)}
                                    </span>
                                  )}

                                  {/* Custom tag */}
                                  {item.isCustom && (
                                    <span className="shrink-0 text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full hidden sm:block tracking-wide uppercase">
                                      custom
                                    </span>
                                  )}

                                  {/* Delete (custom only) */}
                                  {item.isCustom && (
                                    <button
                                      onClick={() => handleDelete(item.id)}
                                      disabled={isDeleting}
                                      aria-label="Delete task"
                                      className="shrink-0 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all duration-150 disabled:opacity-30"
                                    >
                                      {isDeleting ? (
                                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                      ) : (
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      )}
                                    </button>
                                  )}
                                </motion.li>
                              );
                            })}
                          </ul>
                        )}

                        {/* Add custom task */}
                        <div className="px-5 py-3 border-t border-gray-50">
                          <button
                            onClick={() => openAddDialog(key)}
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors group/add"
                          >
                            <span className="w-5 h-5 rounded-full border border-dashed border-gray-300 group-hover/add:border-gray-400 flex items-center justify-center transition-colors shrink-0">
                              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                              </svg>
                            </span>
                            Add custom task
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Milestones section (completed categories) ─────────────── */}
      {completedCategories.length > 0 && filter !== "incomplete" && (
        <div className="pt-1">
          {/* Section divider + header */}
          <button
            onClick={() => setCompletedSectionOpen((v) => !v)}
            className="w-full flex items-center gap-3 px-1 py-2 mb-2 group"
          >
            <div className="flex-1 h-px bg-gradient-to-r from-amber-200/60 to-transparent" />
            <span className="text-[11px] font-medium tracking-widest uppercase text-amber-500/80 shrink-0 flex items-center gap-1.5">
              <span>✦</span>
              <span>
                {completedCategories.length} Milestone{completedCategories.length !== 1 ? "s" : ""} Reached
              </span>
              <span>✦</span>
            </span>
            <div className="flex-1 h-px bg-gradient-to-l from-amber-200/60 to-transparent" />
            <motion.svg
              animate={{ rotate: completedSectionOpen ? 0 : -90 }}
              transition={{ duration: 0.2 }}
              className="w-3.5 h-3.5 text-amber-400/60 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </motion.svg>
          </button>

          {/* Milestone rows */}
          <AnimatePresence initial={false}>
            {completedSectionOpen && (
              <motion.div
                key="milestones"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="space-y-1.5 overflow-hidden"
              >
                {completedCategories.map((key) => (
                  <MilestoneRow
                    key={key}
                    label={CATEGORY_LABELS[key] ?? key}
                    emoji={CATEGORY_EMOJIS[key] ?? "✦"}
                    color={CATEGORY_COLORS[key] ?? "#c9a84c"}
                    total={(grouped[key] ?? []).length}
                    items={grouped[key] ?? []}
                    forceOpen={filter === "complete"}
                    onToggle={handleToggle}
                    togglingId={togglingId}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Dialog */}
      <AddChecklistItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultCategory={dialogDefaultCategory}
        categoryOptions={categoryOrder.map((key) => ({ key, label: CATEGORY_LABELS[key] ?? key }))}
        onSuccess={() => router.refresh()}
      />

      {/* ── Celebration animation ──────────────────────────────── */}
      <ConfettiCanvas active={celebrating} />
      <AnimatePresence>
        {celebrating && (
          <CelebrationOverlay key="overlay" onDismiss={() => setCelebrating(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
