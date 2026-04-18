"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import VendorCard, { type VendorWithPackages, CATEGORY_COLOR } from "@/components/dashboard/VendorCard";
import AddVendorDialog from "@/components/dashboard/AddVendorDialog";
import VendorComparisonTable from "@/components/dashboard/VendorComparisonTable";
import { deleteVendorAction } from "@/lib/actions/vendors";

// ── Types ──────────────────────────────────────────────────────────────────

type Category = "all" | "needsFollowUp" | "venue" | "photographer" | "caterer" | "florist" | "dj" | "officiant" | "hairMakeup" | "transportation" | "cake" | "stationery" | "other";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "all",            label: "All" },
  { value: "needsFollowUp",  label: "Needs Follow-up" },
  { value: "venue",          label: "Venue" },
  { value: "photographer",   label: "Photographer" },
  { value: "caterer",        label: "Caterer" },
  { value: "florist",        label: "Florist" },
  { value: "dj",             label: "DJ" },
  { value: "officiant",      label: "Officiant" },
  { value: "hairMakeup",     label: "Hair & Makeup" },
  { value: "transportation", label: "Transportation" },
  { value: "cake",           label: "Cake" },
  { value: "stationery",     label: "Stationery" },
  { value: "other",          label: "Other" },
];

interface VendorsClientProps {
  initialVendors: VendorWithPackages[];
  totalBudget:    number | null;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function VendorsClient({ initialVendors, totalBudget }: VendorsClientProps) {
  const [vendors,         setVendors]         = useState<VendorWithPackages[]>(initialVendors);
  const [activeCategory,  setActiveCategory]  = useState<Category>("all");
  const [compareIds,      setCompareIds]      = useState<string[]>([]);
  const [dialogOpen,      setDialogOpen]      = useState(false);
  const [editingVendor,   setEditingVendor]   = useState<VendorWithPackages | null>(null);
  const [compareOpen,     setCompareOpen]     = useState(false);

  // Filtered vendors
  const now = new Date();
  const filtered = activeCategory === "all"
    ? vendors
    : activeCategory === "needsFollowUp"
      ? vendors.filter((v) =>
          v.followUpDate != null &&
          new Date(v.followUpDate) < now &&
          (v.status === "prospect" || v.status === "shortlisted")
        )
      : vendors.filter((v) => v.category === activeCategory);

  // Vendors in compare
  const compareVendors = vendors.filter((v) => compareIds.includes(v.id));

  // Category label for floating bar
  const compareCategoryLabel = compareVendors[0]
    ? CATEGORIES.find((c) => c.value === compareVendors[0].category)?.label ?? "Vendors"
    : "Vendors";

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleCategoryChange(cat: Category) {
    setActiveCategory(cat);
    setCompareIds([]);
  }

  function handleCompareChange(id: string, checked: boolean) {
    if (checked) {
      setCompareIds((prev) => [...prev, id]);
    } else {
      setCompareIds((prev) => prev.filter((c) => c !== id));
    }
  }

  function handleEdit(vendor: VendorWithPackages) {
    setEditingVendor(vendor);
    setDialogOpen(true);
  }

  function handleAddNew() {
    setEditingVendor(null);
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this vendor? This cannot be undone.")) return;
    await deleteVendorAction(id);
    setVendors((prev) => prev.filter((v) => v.id !== id));
    setCompareIds((prev) => prev.filter((c) => c !== id));
  }

  function handleStatusChange(id: string, status: string) {
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status } : v))
    );
  }

  function handleDialogSuccess(vendor: VendorWithPackages) {
    setVendors((prev) => {
      const exists = prev.find((v) => v.id === vendor.id);
      if (exists) {
        return prev.map((v) => (v.id === vendor.id ? vendor : v));
      }
      return [...prev, vendor];
    });
  }

  function handleBook(vendorId: string) {
    handleStatusChange(vendorId, "booked");
    setCompareIds([]);
  }

  function isCompareDisabled(vendor: VendorWithPackages): boolean {
    if (compareIds.includes(vendor.id)) return false;
    if (compareIds.length >= 4) return true;
    if (compareIds.length > 0) {
      const existingCategory = vendors.find((v) => v.id === compareIds[0])?.category;
      return vendor.category !== existingCategory;
    }
    return false;
  }

  // ── Budget summary ────────────────────────────────────────────────────────

  const bookedVendors = vendors.filter((v) => v.status === "booked");
  const bookedCost = bookedVendors.reduce((sum, v) => {
    const linkedCost = (v.budgetItems ?? []).reduce((s, b) => s + (b.estimatedCost ?? 0), 0);
    if (linkedCost > 0) return sum + linkedCost;
    const pkgPrices = v.packages.map((p) => p.price).filter((p): p is number => p != null);
    const minPkg = pkgPrices.length > 0 ? Math.min(...pkgPrices) : 0;
    return sum + minPkg;
  }, 0);
  const budgetPct = totalBudget && totalBudget > 0 ? Math.min((bookedCost / totalBudget) * 100, 100) : 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 pb-24">

      {/* Budget summary bar */}
      {totalBudget != null && totalBudget > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-apple-sm px-6 py-5">
          <div className="flex items-start justify-between gap-6 mb-4">
            <div className="flex items-baseline gap-2">
              <svg
                className="w-4 h-4 self-center shrink-0"
                style={{ color: "#C9A84C" }}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              <span className="font-serif text-3xl font-semibold text-gray-900 leading-none">
                {Math.round(budgetPct)}%
              </span>
              <span className="text-[13px] text-gray-500 leading-none self-end pb-0.5">
                of budget committed
              </span>
            </div>
            <div className="text-right shrink-0">
              <p className="font-serif text-xl font-semibold text-gray-900 leading-none">
                ${(totalBudget - bookedCost).toLocaleString()}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5 tracking-wide uppercase">remaining</p>
            </div>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${budgetPct}%`,
                background: budgetPct >= 90
                  ? "linear-gradient(90deg, #f97316, #ef4444)"
                  : budgetPct >= 70
                    ? "linear-gradient(90deg, #f59e0b, #f97316)"
                    : "linear-gradient(90deg, #C9A84C, #10b981)",
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-gray-400">${bookedCost.toLocaleString()} booked</span>
            <span className="text-[11px] text-gray-400">${totalBudget.toLocaleString()} total</span>
          </div>
        </div>
      )}

      {/* Section heading */}
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-2xl text-gray-900">Vendors</h2>
        <span className="text-[12px] text-gray-400 tabular-nums">{vendors.length} total</span>
      </div>

      {/* Category filter tabs + action */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 flex-1">
          {CATEGORIES.map((cat) => {
            const count = cat.value === "all"
              ? vendors.length
              : cat.value === "needsFollowUp"
                ? vendors.filter((v) =>
                    v.followUpDate != null &&
                    new Date(v.followUpDate) < now &&
                    (v.status === "prospect" || v.status === "shortlisted")
                  ).length
                : vendors.filter((v) => v.category === cat.value).length;
            const isActive = activeCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 whitespace-nowrap",
                  isActive
                    ? "bg-white shadow-apple-sm border border-gray-200 text-gray-900"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                )}
              >
                {cat.value !== "all" && cat.value !== "needsFollowUp" && (
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLOR[cat.value]?.border ?? "#D1D1D1" }}
                  />
                )}
                {cat.label}
                {count > 0 && (
                  <span className={cn(
                    "text-[10px] rounded-full px-1.5 py-0.5 font-semibold leading-none tabular-nums",
                    isActive ? "bg-gray-900 text-white" : "text-gray-400"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <Button variant="primary" size="sm" onClick={handleAddNew} className="shrink-0">
          Add vendor
        </Button>
      </div>

      {/* Vendor grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-gray-100" />
            <div className="absolute inset-2 rounded-full border border-gray-100" style={{ opacity: 0.5 }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <h3 className="font-serif text-2xl text-gray-800 mb-2">
            {activeCategory === "all" ? "No vendors yet" : `No ${CATEGORIES.find(c => c.value === activeCategory)?.label ?? ""} vendors`}
          </h3>
          <p className="text-[13px] text-gray-400 max-w-xs mb-8 leading-relaxed">
            Add vendors to track contacts, packages, and compare options side by side.
          </p>
          <Button variant="primary" size="md" onClick={handleAddNew}>
            Add your first vendor
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((vendor, index) => (
            <VendorCard
              key={vendor.id}
              index={index}
              vendor={vendor}
              compareChecked={compareIds.includes(vendor.id)}
              compareDisabled={isCompareDisabled(vendor)}
              onCompareChange={handleCompareChange}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Compare hint */}
      {(activeCategory === "all" || activeCategory === "needsFollowUp") && vendors.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          Select a category tab to enable side-by-side comparison within that category.
        </p>
      )}

      {/* Floating comparison bar */}
      <AnimatePresence>
        {compareIds.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-white rounded-2xl shadow-apple-xl px-5 py-3.5 border border-gray-100"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {compareVendors.slice(0, 4).map((v) => (
                  <div
                    key={v.id}
                    className="w-7 h-7 rounded-full bg-accent-light text-accent text-[10px] font-semibold flex items-center justify-center ring-2 ring-white"
                    title={v.name}
                  >
                    {v.name.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
              <span className="text-[13px] font-medium text-gray-700">
                Compare {compareIds.length} {compareCategoryLabel}{compareIds.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCompareIds([])}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2"
              >
                Clear
              </button>
              <Button variant="primary" size="sm" onClick={() => setCompareOpen(true)}>
                Compare →
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit dialog */}
      <AddVendorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingVendor={editingVendor}
        onSuccess={handleDialogSuccess}
      />

      {/* Comparison table */}
      <VendorComparisonTable
        open={compareOpen}
        onOpenChange={setCompareOpen}
        vendors={compareVendors}
        onBook={handleBook}
      />
    </div>
  );
}
