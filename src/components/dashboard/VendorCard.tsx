"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { updateVendorStatusAction } from "@/lib/actions/vendors";
import type { Vendor, VendorPackage, VendorDocument, VendorPayment, VendorMeeting, BudgetItem } from "@prisma/client";

// ── Types ──────────────────────────────────────────────────────────────────

export type VendorWithPackages = Vendor & {
  packages:    VendorPackage[];
  documents:   VendorDocument[];
  payments:    VendorPayment[];
  meetings:    VendorMeeting[];
  budgetItems: BudgetItem[];
};

type Status = "prospect" | "shortlisted" | "booked" | "rejected";

const STATUS_CYCLE: Status[] = ["prospect", "shortlisted", "booked", "rejected"];

const STATUS_LABEL: Record<Status, string> = {
  prospect:    "Prospect",
  shortlisted: "Shortlisted",
  booked:      "Booked",
  rejected:    "Rejected",
};

const STATUS_STYLE: Record<Status, string> = {
  prospect:    "bg-gray-50 text-gray-500 border border-gray-200",
  shortlisted: "bg-amber-50 text-amber-600 border border-amber-200",
  booked:      "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rejected:    "bg-red-50 text-red-500 border border-red-200",
};

export const CATEGORY_COLOR: Record<string, { border: string; badge: string }> = {
  venue:          { border: "#C9A3A3", badge: "bg-rose-50 text-rose-600" },
  photographer:   { border: "#8FA8C8", badge: "bg-slate-100 text-slate-600" },
  caterer:        { border: "#C4A882", badge: "bg-amber-50 text-amber-700" },
  florist:        { border: "#8BB89A", badge: "bg-emerald-50 text-emerald-700" },
  dj:             { border: "#9B8EC4", badge: "bg-violet-50 text-violet-700" },
  officiant:      { border: "#C4B08A", badge: "bg-yellow-50 text-yellow-700" },
  hairMakeup:     { border: "#D4A0B0", badge: "bg-pink-50 text-pink-600" },
  transportation: { border: "#8AAEC4", badge: "bg-sky-50 text-sky-700" },
  cake:           { border: "#C4A8B8", badge: "bg-fuchsia-50 text-fuchsia-700" },
  stationery:     { border: "#A8B8A8", badge: "bg-teal-50 text-teal-700" },
  other:          { border: "#B0B0B0", badge: "bg-gray-100 text-gray-500" },
};

export const CATEGORY_LABEL: Record<string, string> = {
  venue: "Venue", photographer: "Photographer", caterer: "Caterer",
  florist: "Florist", dj: "DJ", officiant: "Officiant",
  hairMakeup: "Hair & Makeup", transportation: "Transportation",
  cake: "Cake", stationery: "Stationery", other: "Other",
};

interface VendorCardProps {
  vendor:          VendorWithPackages;
  index:           number;
  compareChecked:  boolean;
  compareDisabled: boolean;
  onCompareChange: (id: string, checked: boolean) => void;
  onEdit:          (vendor: VendorWithPackages) => void;
  onDelete:        (id: string) => void;
  onStatusChange:  (id: string, status: string) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function priceRange(packages: VendorPackage[]): string {
  const prices = packages.map((p) => p.price).filter((p): p is number => p != null);
  if (prices.length === 0) return "—";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n.toLocaleString()}`;
  return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function VendorCard({
  vendor,
  index,
  compareChecked,
  compareDisabled,
  onCompareChange,
  onEdit,
  onDelete,
  onStatusChange,
}: VendorCardProps) {
  const status = vendor.status as Status;

  const catColor = CATEGORY_COLOR[vendor.category ?? "other"] ?? CATEGORY_COLOR["other"];
  const catLabel = CATEGORY_LABEL[vendor.category ?? "other"] ?? "Other";

  const needsFollowUp =
    vendor.followUpDate != null &&
    new Date(vendor.followUpDate) < new Date() &&
    (status === "prospect" || status === "shortlisted");

  const nextPayment = (vendor.payments ?? [])
    .filter((p) => !p.paidAt)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0] ?? null;

  const nextPaymentOverdue = nextPayment && new Date(nextPayment.dueDate) < new Date();
  const nextPaymentSoon =
    nextPayment &&
    !nextPaymentOverdue &&
    new Date(nextPayment.dueDate).getTime() - Date.now() < 14 * 24 * 60 * 60 * 1000;

  async function cycleStatus() {
    const nextIndex = (STATUS_CYCLE.indexOf(status) + 1) % STATUS_CYCLE.length;
    const next = STATUS_CYCLE[nextIndex];
    onStatusChange(vendor.id, next);
    await updateVendorStatusAction(vendor.id, next);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94], delay: index * 0.05 }}
      className="group relative bg-white rounded-xl shadow-apple-md border border-gray-100 flex flex-col overflow-hidden transition-all duration-200 hover:shadow-apple-lg hover:-translate-y-0.5"
    >
      {/* Category accent line */}
      <div className="h-[3px] w-full shrink-0" style={{ backgroundColor: catColor.border }} />

      {/* Card body */}
      <div className="p-5 flex-1 flex flex-col gap-3">

        {/* Category label */}
        <span className={cn("self-start text-[10px] font-semibold tracking-widest uppercase rounded-full px-2 py-0.5", catColor.badge)}>
          {catLabel}
        </span>

        {/* Vendor name + status badge */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-xl leading-tight text-gray-900 flex-1 min-w-0">{vendor.name}</h3>
          <button
            onClick={cycleStatus}
            title="Click to cycle status"
            className={cn(
              "shrink-0 text-[10px] font-semibold tracking-wide px-2.5 py-1 rounded-full border transition-colors cursor-pointer",
              STATUS_STYLE[status]
            )}
          >
            {STATUS_LABEL[status]}
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Contact info */}
        <div className="space-y-0.5">
          {vendor.contactName && (
            <p className="text-[13px] font-medium text-gray-700">{vendor.contactName}</p>
          )}
          {vendor.email && (
            <p className="text-[12px] text-gray-400 truncate">{vendor.email}</p>
          )}
          {vendor.phone && (
            <p className="text-[12px] text-gray-400">{vendor.phone}</p>
          )}
        </div>

        {/* Price + packages/docs */}
        <div className="flex items-end justify-between mt-auto pt-1">
          <span className="text-[11px] text-gray-400 flex items-center gap-2">
            {vendor.packages.length === 0
              ? "No packages"
              : `${vendor.packages.length} pkg${vendor.packages.length > 1 ? "s" : ""}`}
            {vendor.documents.length > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {vendor.documents.length}
              </span>
            )}
          </span>
          <span className="font-serif text-lg font-semibold text-gray-800 leading-none">
            {priceRange(vendor.packages)}
          </span>
        </div>

        {/* Follow-up warning */}
        {needsFollowUp && (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 text-amber-700 text-[11px] font-medium rounded-lg px-3 py-2">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            Follow-up overdue
          </div>
        )}

        {/* Next payment badge */}
        {nextPayment && (
          <div className={cn(
            "flex items-center gap-1.5 text-[11px] font-medium rounded-lg px-3 py-2 border",
            nextPaymentOverdue
              ? "bg-red-50 text-red-600 border-red-100"
              : nextPaymentSoon
                ? "bg-amber-50 text-amber-700 border-amber-100"
                : "bg-gray-50 text-gray-500 border-gray-100"
          )}>
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {nextPayment.label}: ${nextPayment.amount.toLocaleString()} due {new Date(nextPayment.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
        )}

        {/* Notes snippet */}
        {vendor.notes && (
          <p className="text-[12px] text-gray-400 line-clamp-2">{vendor.notes}</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between gap-2">
        {/* Compare checkbox */}
        <label
          className={cn(
            "flex items-center gap-1.5 text-[12px] text-gray-400 cursor-pointer select-none hover:text-gray-600 transition-colors",
            compareDisabled && !compareChecked && "opacity-40 cursor-not-allowed"
          )}
        >
          <input
            type="checkbox"
            checked={compareChecked}
            disabled={compareDisabled && !compareChecked}
            onChange={(e) => onCompareChange(vendor.id, e.target.checked)}
            className="accent-accent w-3.5 h-3.5"
          />
          Compare
        </label>

        {/* Actions — revealed on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={() => onEdit(vendor)}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-accent hover:bg-accent-light transition-colors"
            title="Edit vendor"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(vendor.id)}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Delete vendor"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
