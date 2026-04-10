"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { addBudgetItemAction, updateBudgetItemAction } from "@/lib/actions/budget";
import type { BudgetItem, PaymentStatus } from "@prisma/client";

// ── Types ──────────────────────────────────────────────────────────────────

interface CategoryOption {
  id:    string;
  name:  string;
  color: string;
}

interface AddBudgetItemDialogProps {
  open:              boolean;
  onOpenChange:      (open: boolean) => void;
  categories:        CategoryOption[];
  defaultCategoryId: string;
  editingItem:       BudgetItem | null;
  onSuccess:         () => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function AddBudgetItemDialog({
  open,
  onOpenChange,
  categories,
  defaultCategoryId,
  editingItem,
  onSuccess,
}: AddBudgetItemDialogProps) {
  const [name,           setName]           = useState("");
  const [vendorName,     setVendorName]     = useState("");
  const [categoryId,     setCategoryId]     = useState(defaultCategoryId);
  const [estimatedCost,  setEstimatedCost]  = useState("");
  const [actualCost,     setActualCost]     = useState("");
  const [amountPaid,     setAmountPaid]     = useState("0");
  const [paymentStatus,  setPaymentStatus]  = useState<PaymentStatus>("PENDING");
  const [dueDate,        setDueDate]        = useState("");
  const [notes,          setNotes]          = useState("");
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");

  // Pre-populate or reset when dialog opens / editingItem changes
  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setVendorName(editingItem.vendorName ?? "");
      setCategoryId(editingItem.categoryId);
      setEstimatedCost(String(editingItem.estimatedCost));
      setActualCost(editingItem.actualCost != null ? String(editingItem.actualCost) : "");
      setAmountPaid(String(editingItem.amountPaid));
      setPaymentStatus(editingItem.paymentStatus);
      setDueDate(
        editingItem.dueDate
          ? new Date(editingItem.dueDate).toISOString().split("T")[0]
          : ""
      );
      setNotes(editingItem.notes ?? "");
    } else {
      setName("");
      setVendorName("");
      setCategoryId(defaultCategoryId);
      setEstimatedCost("");
      setActualCost("");
      setAmountPaid("0");
      setPaymentStatus("PENDING");
      setDueDate("");
      setNotes("");
    }
    setError("");
  }, [editingItem, defaultCategoryId, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const payload = {
      categoryId,
      name:          name.trim(),
      estimatedCost: parseFloat(estimatedCost) || 0,
      actualCost:    actualCost !== "" ? parseFloat(actualCost) : null,
      amountPaid:    parseFloat(amountPaid) || 0,
      vendorName:    vendorName.trim() || null,
      dueDate:       dueDate || null,
      notes:         notes.trim() || null,
      paymentStatus,
    };

    setLoading(true);
    try {
      if (editingItem) {
        await updateBudgetItemAction(editingItem.id, payload);
      } else {
        await addBudgetItemAction(payload);
      }
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const isEditMode = !!editingItem;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Backdrop */}
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
              />
            </Dialog.Overlay>

            {/* Dialog */}
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 8 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed inset-0 flex items-center justify-center z-50 p-4"
              >
                <div className="bg-white rounded-xl shadow-apple-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <Dialog.Title className="text-[15px] font-semibold text-gray-900">
                      {isEditMode ? "Edit item" : "Add budget item"}
                    </Dialog.Title>
                    <Dialog.Close className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Dialog.Close>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Item name */}
                    <Input
                      label="Item name *"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Wedding photographer"
                      required
                    />

                    {/* Category + Vendor */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-600">Category *</label>
                        <select
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                          required
                          className="w-full px-4 py-3 min-h-[44px] rounded-md text-[15px] bg-gray-100 border-0 text-gray-900 outline-none transition-all duration-150 focus:bg-white focus:shadow-apple-sm focus:ring-2 focus:ring-accent/25"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <Input
                        label="Vendor (optional)"
                        value={vendorName}
                        onChange={(e) => setVendorName(e.target.value)}
                        placeholder="e.g. Studio A"
                      />
                    </div>

                    {/* Estimated / Actual / Paid */}
                    <div className="grid grid-cols-3 gap-3">
                      <Input
                        label="Estimated *"
                        type="number"
                        min="0"
                        step="0.01"
                        value={estimatedCost}
                        onChange={(e) => setEstimatedCost(e.target.value)}
                        placeholder="0"
                        required
                      />
                      <Input
                        label="Actual"
                        type="number"
                        min="0"
                        step="0.01"
                        value={actualCost}
                        onChange={(e) => setActualCost(e.target.value)}
                        placeholder="0"
                        hint="When confirmed"
                      />
                      <Input
                        label="Amount Paid"
                        type="number"
                        min="0"
                        step="0.01"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        placeholder="0"
                      />
                    </div>

                    {/* Payment status toggle */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">Payment status</label>
                      <div className="flex gap-2">
                        {(["PENDING", "DEPOSIT_PAID", "PAID"] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setPaymentStatus(s)}
                            className={cn(
                              "flex-1 py-2.5 rounded-md text-xs font-medium transition-all duration-150",
                              paymentStatus === s
                                ? "bg-accent text-white shadow-sm"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            )}
                          >
                            {s === "PENDING" ? "Pending" : s === "DEPOSIT_PAID" ? "Deposit Paid" : "Paid in Full"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Due date */}
                    <Input
                      label="Due date (optional)"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />

                    {/* Notes */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-gray-600">Notes (optional)</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder="Contract details, reminders..."
                        className="w-full px-4 py-3 rounded-md text-[15px] bg-gray-100 border-0 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 resize-none focus:bg-white focus:shadow-apple-sm focus:ring-2 focus:ring-accent/25"
                      />
                    </div>

                    {/* Error */}
                    {error && (
                      <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
                    )}

                    {/* Footer buttons */}
                    <div className="flex gap-3 pt-2">
                      <Dialog.Close asChild>
                        <Button type="button" variant="secondary" size="md" className="flex-1">
                          Cancel
                        </Button>
                      </Dialog.Close>
                      <Button type="submit" variant="primary" size="md" loading={loading} className="flex-1">
                        {isEditMode ? "Save changes" : "Add item"}
                      </Button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
