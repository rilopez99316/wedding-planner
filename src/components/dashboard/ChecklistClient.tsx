"use client";

import { useState } from "react";
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

  // ── Derived ───────────────────────────────────────────────────────────────

  const totalCount     = items.length;
  const completedCount = items.filter((i) => i.completedAt !== null).length;
  const pct            = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const grouped = categoryOrder.reduce<Record<string, ChecklistItem[]>>((acc, key) => {
    acc[key] = items.filter((i) => i.category === key);
    return acc;
  }, {});

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

        <div className="relative px-6 py-5 flex items-center gap-5">
          {/* Percentage ring */}
          <div className="shrink-0 flex flex-col items-center gap-0.5">
            <p className="text-5xl font-bold leading-none tabular-nums" style={{ color: "#c9a84c" }}>
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
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
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

      {/* ── Category accordions ───────────────────────────────────── */}
      <div className="space-y-2">
        {categoryOrder.map((key) => {
          const allItems      = grouped[key] ?? [];
          const filteredItems = getFilteredItems(key);
          const catCompleted  = allItems.filter((i) => i.completedAt !== null).length;
          const catTotal      = allItems.length;
          const catPct        = catTotal > 0 ? Math.round((catCompleted / catTotal) * 100) : 0;
          const isOpen        = openCategories.has(key);
          const label         = CATEGORY_LABELS[key] ?? key;
          const color         = CATEGORY_COLORS[key] ?? "#6b7280";
          const emoji         = CATEGORY_EMOJIS[key] ?? "✦";
          const isDone        = catTotal > 0 && catCompleted === catTotal;

          return (
            <div
              key={key}
              className={cn(
                "bg-white rounded-2xl border overflow-hidden transition-shadow duration-200",
                isDone
                  ? "border-amber-200 shadow-[0_0_0_1px_rgba(201,168,76,0.15),0_2px_8px_rgba(201,168,76,0.08)]"
                  : "border-gray-100 shadow-apple-sm"
              )}
            >
              {/* Category header */}
              <button
                onClick={() => toggleAccordion(key)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50/70 transition-colors"
              >
                {/* Emoji */}
                <span className="text-lg shrink-0 leading-none">{emoji}</span>

                {/* Label */}
                <span className={cn(
                  "flex-1 font-serif text-base",
                  isDone ? "text-amber-700/70" : "text-gray-800"
                )}>
                  {label}
                </span>

                {/* Done badge */}
                {isDone && (
                  <span className="shrink-0 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                    Complete ✦
                  </span>
                )}

                {/* Fraction */}
                {!isDone && (
                  <span className="text-xs font-medium text-gray-400 shrink-0">
                    {catCompleted}/{catTotal}
                  </span>
                )}

                {/* Mini progress bar */}
                <div className="w-14 h-1 bg-gray-100 rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${catPct}%`,
                      backgroundColor: isDone ? "#c9a84c" : color,
                    }}
                  />
                </div>

                {/* Chevron */}
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
                            const isComplete  = item.completedAt !== null;
                            const isToggling  = togglingId === item.id;
                            const isDeleting  = deletingId === item.id;
                            const showSparks  = justCheckedId === item.id;

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
                                  {/* Sparkle burst on check */}
                                  <AnimatePresence>
                                    {showSparks && <Sparkles key="sparks" color={color} />}
                                  </AnimatePresence>

                                  <motion.span
                                    animate={{
                                      scale: isToggling ? 0.8 : isComplete ? 1.05 : 1,
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                    className="absolute inset-0 rounded-full border-2 flex items-center justify-center"
                                    style={{
                                      borderColor: isComplete ? color : "#d1d5db",
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
                                <span
                                  className={cn(
                                    "flex-1 text-sm leading-snug transition-all duration-200",
                                    isComplete ? "line-through text-gray-400" : "text-gray-800"
                                  )}
                                >
                                  {item.title}
                                </span>

                                {/* Due date chip */}
                                {item.dueDate && (
                                  <span
                                    className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full hidden sm:block transition-colors"
                                    style={{
                                      backgroundColor: isComplete ? "#f3f4f6" : `${color}18`,
                                      color: isComplete ? "#9ca3af" : color,
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
            </div>
          );
        })}
      </div>

      {/* Dialog */}
      <AddChecklistItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultCategory={dialogDefaultCategory}
        categoryOptions={categoryOrder.map((key) => ({ key, label: CATEGORY_LABELS[key] ?? key }))}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
