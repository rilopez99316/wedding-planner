"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import VendorCard, { type VendorWithPackages } from "@/components/dashboard/VendorCard";
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
    setCompareIds([]); // clear compare when switching tabs
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

  // Max 4 in compare, and only same-category vendors
  function isCompareDisabled(vendor: VendorWithPackages): boolean {
    if (compareIds.includes(vendor.id)) return false;
    if (compareIds.length >= 4) return true;
    // If there are already some in compare, restrict to same category
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
        <div className="bg-white rounded-xl border border-gray-100 shadow-apple-sm px-5 py-4 flex items-center gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-[13px] font-medium text-gray-700">
                Booked: <span className="text-gray-900 font-semibold">${bookedCost.toLocaleString()}</span>
              </span>
              <span className="text-[12px] text-gray-400">
                of ${totalBudget.toLocaleString()} budget
              </span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  budgetPct >= 90 ? "bg-red-400" : budgetPct >= 70 ? "bg-amber-400" : "bg-green-400"
                )}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[13px] font-semibold text-gray-900">
              ${(totalBudget - bookedCost).toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-400">remaining</p>
          </div>
        </div>
      )}

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
          return (
            <button
              key={cat.value}
              onClick={() => handleCategoryChange(cat.value)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 flex items-center gap-1.5",
                activeCategory === cat.value
                  ? "bg-accent-light text-accent"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
              )}
            >
              {cat.label}
              {count > 0 && (
                <span
                  className={cn(
                    "text-[11px] rounded-full px-1.5 py-0.5 leading-none",
                    activeCategory === cat.value ? "bg-accent/10 text-accent" : "bg-white text-gray-500"
                  )}
                >
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
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-[15px] font-semibold text-gray-900 mb-1">
            {activeCategory === "all" ? "No vendors yet" : `No ${CATEGORIES.find(c => c.value === activeCategory)?.label ?? ""} vendors yet`}
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mb-6">
            Add vendors to track contacts, packages, and compare options side by side.
          </p>
          <Button variant="primary" size="md" onClick={handleAddNew}>
            Add your first vendor
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((vendor) => (
            <VendorCard
              key={vendor.id}
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

      {/* Compare hint when on All or needsFollowUp tab */}
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
