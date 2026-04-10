"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import AddBudgetItemDialog from "@/components/dashboard/AddBudgetItemDialog";
import {
  updateTotalBudgetAction,
  addBudgetCategoryAction,
  updateBudgetCategoryAction,
  deleteBudgetCategoryAction,
  deleteBudgetItemAction,
} from "@/lib/actions/budget";
import type { BudgetCategory, BudgetItem, PaymentStatus } from "@prisma/client";

// ── Types ──────────────────────────────────────────────────────────────────

type BudgetCategoryWithItems = BudgetCategory & { items: BudgetItem[] };

interface BudgetClientProps {
  weddingId: string;
  totalBudget: number | null;
  categories: BudgetCategoryWithItems[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const COLOR_PALETTE = [
  "#6366f1", "#f59e0b", "#10b981", "#3b82f6",
  "#ec4899", "#8b5cf6", "#14b8a6", "#f97316", "#06b6d4", "#6b7280",
];

const STATUS_CONFIG: Record<PaymentStatus, { label: string; variant: "default" | "warning" | "success" }> = {
  PENDING:      { label: "Pending",      variant: "default"  },
  DEPOSIT_PAID: { label: "Deposit Paid", variant: "warning"  },
  PAID:         { label: "Paid",         variant: "success"  },
};

// ── Main component ─────────────────────────────────────────────────────────

export default function BudgetClient({
  weddingId,
  totalBudget: initialTotalBudget,
  categories,
}: BudgetClientProps) {
  const router = useRouter();

  // Summary / budget editing
  const [editingBudget, setEditingBudget]   = useState(false);
  const [budgetInput, setBudgetInput]       = useState(String(initialTotalBudget ?? ""));
  const [savingBudget, setSavingBudget]     = useState(false);

  // Accordion
  const [openCategoryIds, setOpenCategoryIds] = useState<Set<string>>(new Set());

  // Inline category editing
  const [editingCatId, setEditingCatId]     = useState<string | null>(null);
  const [editCatName, setEditCatName]       = useState("");
  const [editCatColor, setEditCatColor]     = useState("#6B7280");
  const [savingCatId, setSavingCatId]       = useState<string | null>(null);

  // Add new category inline
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCatName, setNewCatName]         = useState("");
  const [newCatColor, setNewCatColor]       = useState("#6366f1");
  const [savingNewCat, setSavingNewCat]     = useState(false);

  // Item dialog
  const [itemDialogOpen, setItemDialogOpen]       = useState(false);
  const [editingItem, setEditingItem]             = useState<BudgetItem | null>(null);
  const [dialogDefaultCatId, setDialogDefaultCatId] = useState("");

  // Loading states
  const [deletingItemId, setDeletingItemId]   = useState<string | null>(null);
  const [deletingCatId, setDeletingCatId]     = useState<string | null>(null);

  // Error
  const [error, setError] = useState<string | null>(null);

  // ── Derived totals ───────────────────────────────────────────────────────

  const estimatedTotal = categories.reduce(
    (s, c) => s + c.items.reduce((ss, i) => ss + i.estimatedCost, 0), 0
  );
  const amountPaid = categories.reduce(
    (s, c) => s + c.items.reduce((ss, i) => ss + i.amountPaid, 0), 0
  );
  const totalBudget = initialTotalBudget;
  const remaining   = (totalBudget ?? 0) - amountPaid;
  const allocationPct = totalBudget
    ? Math.min((estimatedTotal / totalBudget) * 100, 100)
    : 0;

  // ── Handlers ─────────────────────────────────────────────────────────────

  function toggleCategory(id: string) {
    setOpenCategoryIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSaveBudget() {
    const val = parseFloat(budgetInput);
    if (isNaN(val) || val < 0) {
      setError("Enter a valid budget amount.");
      return;
    }
    setSavingBudget(true);
    setError(null);
    try {
      await updateTotalBudgetAction(val);
      setEditingBudget(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save budget.");
    } finally {
      setSavingBudget(false);
    }
  }

  async function handleSaveNewCategory() {
    if (!newCatName.trim()) return;
    setSavingNewCat(true);
    setError(null);
    try {
      await addBudgetCategoryAction({ name: newCatName.trim(), color: newCatColor });
      setAddingCategory(false);
      setNewCatName("");
      setNewCatColor("#6366f1");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add category.");
    } finally {
      setSavingNewCat(false);
    }
  }

  async function handleSaveEditCategory(id: string) {
    setSavingCatId(id);
    setError(null);
    try {
      await updateBudgetCategoryAction(id, { name: editCatName.trim(), color: editCatColor });
      setEditingCatId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update category.");
    } finally {
      setSavingCatId(null);
    }
  }

  async function handleDeleteCategory(id: string, itemCount: number) {
    if (itemCount > 0) {
      setError("Remove all items from this category before deleting it.");
      return;
    }
    if (!confirm("Delete this category?")) return;
    setDeletingCatId(id);
    setError(null);
    try {
      await deleteBudgetCategoryAction(id);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete category.");
    } finally {
      setDeletingCatId(null);
    }
  }

  async function handleDeleteItem(id: string) {
    if (!confirm("Delete this item?")) return;
    setDeletingItemId(id);
    setError(null);
    try {
      await deleteBudgetItemAction(id);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete item.");
    } finally {
      setDeletingItemId(null);
    }
  }

  function openAddItemDialog(categoryId: string) {
    setEditingItem(null);
    setDialogDefaultCatId(categoryId);
    setItemDialogOpen(true);
  }

  function openEditItemDialog(item: BudgetItem) {
    setEditingItem(item);
    setDialogDefaultCatId(item.categoryId);
    setItemDialogOpen(true);
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl">
      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between gap-3 mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="shrink-0 text-red-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Budget */}
        <Card variant="flat" padding="sm">
          <p className="text-xs font-medium text-gray-400 mb-1">Total Budget</p>
          {editingBudget ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">$</span>
              <input
                autoFocus
                type="number"
                min="0"
                step="100"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveBudget();
                  if (e.key === "Escape") setEditingBudget(false);
                }}
                className="w-full text-lg font-semibold bg-transparent outline-none border-b border-accent"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className={cn("text-xl font-semibold", totalBudget ? "text-gray-900" : "text-gray-400")}>
                {totalBudget ? formatCurrency(totalBudget) : "Set budget"}
              </span>
              <button
                onClick={() => { setBudgetInput(String(totalBudget ?? "")); setEditingBudget(true); }}
                className="shrink-0 text-gray-300 hover:text-accent transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}
          {editingBudget && (
            <div className="flex gap-1.5 mt-2">
              <Button size="sm" variant="primary" loading={savingBudget} onClick={handleSaveBudget}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingBudget(false)}>
                Cancel
              </Button>
            </div>
          )}
        </Card>

        {/* Estimated */}
        <Card variant="flat" padding="sm">
          <p className="text-xs font-medium text-gray-400 mb-1">Estimated</p>
          <p className="text-xl font-semibold text-gray-900">{formatCurrency(estimatedTotal)}</p>
          <p className="text-xs text-gray-400 mt-0.5">across all items</p>
        </Card>

        {/* Paid */}
        <Card variant="flat" padding="sm">
          <p className="text-xs font-medium text-gray-400 mb-1">Paid so far</p>
          <p className="text-xl font-semibold text-gray-900">{formatCurrency(amountPaid)}</p>
          {totalBudget && totalBudget > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {Math.round((amountPaid / totalBudget) * 100)}% of budget
            </p>
          )}
        </Card>

        {/* Remaining */}
        <Card variant="flat" padding="sm">
          <p className="text-xs font-medium text-gray-400 mb-1">Remaining</p>
          <p className={cn("text-xl font-semibold", remaining < 0 ? "text-red-600" : "text-gray-900")}>
            {formatCurrency(remaining)}
          </p>
          <p className={cn("text-xs mt-0.5", remaining < 0 ? "text-red-400" : "text-gray-400")}>
            {remaining < 0 ? "Over budget!" : "left in budget"}
          </p>
        </Card>
      </div>

      {/* Allocation bar */}
      {totalBudget ? (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Budget Allocated</span>
            <span>{allocationPct.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                allocationPct >= 100 ? "bg-red-500" :
                allocationPct >= 80  ? "bg-amber-400" : "bg-accent"
              )}
              style={{ width: `${allocationPct}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
          Set a total budget above to track allocation across categories.
        </div>
      )}

      {/* Category accordion */}
      <div className="space-y-2">
        {categories.map((category) => {
          const isOpen    = openCategoryIds.has(category.id);
          const isEditing = editingCatId === category.id;
          const catEst    = category.items.reduce((s, i) => s + i.estimatedCost, 0);
          const catPaid   = category.items.reduce((s, i) => s + i.amountPaid, 0);
          const catPct    = catEst > 0 ? Math.min((catPaid / catEst) * 100, 100) : 0;

          return (
            <div key={category.id} className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-apple-sm">
              {/* Category header */}
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 cursor-pointer select-none",
                  !isEditing && "hover:bg-gray-50/50"
                )}
                onClick={() => !isEditing && toggleCategory(category.id)}
              >
                {/* Color dot */}
                {isEditing ? (
                  <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditCatColor(c)}
                        className={cn(
                          "w-4 h-4 rounded-full transition-transform",
                          editCatColor === c ? "scale-125 ring-2 ring-offset-1 ring-gray-400" : ""
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                ) : (
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                )}

                {/* Name */}
                {isEditing ? (
                  <input
                    autoFocus
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); handleSaveEditCategory(category.id); }
                      if (e.key === "Escape") setEditingCatId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 text-sm font-medium bg-transparent border-b border-accent outline-none"
                  />
                ) : (
                  <span className="flex-1 text-sm font-medium text-gray-900">{category.name}</span>
                )}

                {/* Subtotals + mini bar */}
                {!isEditing && (
                  <>
                    <span className="hidden sm:block text-xs text-gray-400 shrink-0">
                      {formatCurrency(catEst)} est.
                    </span>
                    <span className="hidden sm:block text-xs text-gray-500 font-medium shrink-0">
                      {formatCurrency(catPaid)} paid
                    </span>
                    <div className="hidden sm:block w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${catPct}%`, backgroundColor: category.color }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {category.items.length} item{category.items.length !== 1 ? "s" : ""}
                    </span>
                  </>
                )}

                {/* Edit / Save / Delete actions */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {isEditing ? (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        loading={savingCatId === category.id}
                        onClick={() => handleSaveEditCategory(category.id)}
                      >
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingCatId(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingCatId(category.id);
                          setEditCatName(category.name);
                          setEditCatColor(category.color);
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        disabled={deletingCatId === category.id}
                        onClick={() => handleDeleteCategory(category.id, category.items.length)}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      {/* Chevron */}
                      <svg
                        className={cn("w-4 h-4 text-gray-300 transition-transform duration-200", isOpen && "rotate-180")}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded items */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="border-t border-gray-100">
                      {category.items.length === 0 ? (
                        <p className="px-4 py-4 text-sm text-gray-400 text-center">
                          No items yet.
                        </p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-50">
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Item</th>
                              <th className="hidden md:table-cell px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vendor</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Estimated</th>
                              <th className="hidden md:table-cell px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actual</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Paid</th>
                              <th className="hidden md:table-cell px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Due</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                              <th className="px-4 py-2" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {category.items.map((item) => {
                              const status = STATUS_CONFIG[item.paymentStatus];
                              return (
                                <tr key={item.id} className="hover:bg-gray-50/50 group">
                                  <td className="px-4 py-2.5">
                                    <span className="font-medium text-gray-900">{item.name}</span>
                                    {item.notes && (
                                      <p className="text-xs text-gray-400 truncate max-w-[180px]">{item.notes}</p>
                                    )}
                                  </td>
                                  <td className="hidden md:table-cell px-4 py-2.5 text-gray-500">
                                    {item.vendorName ?? <span className="text-gray-300">—</span>}
                                  </td>
                                  <td className="px-4 py-2.5 text-right text-gray-700 tabular-nums">
                                    {formatCurrency(item.estimatedCost)}
                                  </td>
                                  <td className="hidden md:table-cell px-4 py-2.5 text-right text-gray-700 tabular-nums">
                                    {item.actualCost != null
                                      ? formatCurrency(item.actualCost)
                                      : <span className="text-gray-300">—</span>}
                                  </td>
                                  <td className="px-4 py-2.5 text-right font-medium text-gray-900 tabular-nums">
                                    {formatCurrency(item.amountPaid)}
                                  </td>
                                  <td className="hidden md:table-cell px-4 py-2.5 text-gray-500 text-xs">
                                    {item.dueDate
                                      ? formatDate(item.dueDate)
                                      : <span className="text-gray-300">—</span>}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <Badge variant={status.variant}>{status.label}</Badge>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => openEditItemDialog(item)}
                                        className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-accent hover:bg-accent/5 transition-colors"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                      </button>
                                      <button
                                        disabled={deletingItemId === item.id}
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}

                      {/* Add item to this category */}
                      <div className="px-4 py-3 border-t border-gray-50">
                        <button
                          onClick={() => openAddItemDialog(category.id)}
                          className="flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          Add item to {category.name}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Add category row */}
        {addingCategory ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-apple-sm">
            <div className="flex gap-1.5 shrink-0">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewCatColor(c)}
                  className={cn(
                    "w-4 h-4 rounded-full transition-transform",
                    newCatColor === c ? "scale-125 ring-2 ring-offset-1 ring-gray-400" : ""
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <input
              autoFocus
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveNewCategory();
                if (e.key === "Escape") { setAddingCategory(false); setNewCatName(""); }
              }}
              placeholder="Category name"
              className="flex-1 text-sm bg-transparent outline-none"
            />
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="primary" loading={savingNewCat} onClick={handleSaveNewCategory}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setAddingCategory(false); setNewCatName(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingCategory(true)}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm text-gray-400 hover:text-accent hover:bg-gray-50 rounded-lg border border-dashed border-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add category
          </button>
        )}
      </div>

      {/* Add / Edit item dialog */}
      <AddBudgetItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        categories={categories.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
        defaultCategoryId={dialogDefaultCatId}
        editingItem={editingItem}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
