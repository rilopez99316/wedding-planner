"use client";

import { useState } from "react";
import type { VendorPayment } from "@prisma/client";
import {
  addVendorPaymentAction,
  markVendorPaymentPaidAction,
  deleteVendorPaymentAction,
} from "@/lib/actions/vendors";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface VendorPaymentsTabProps {
  vendorId:        string;
  initialPayments: VendorPayment[];
}

function paymentStatus(payment: VendorPayment): "paid" | "overdue" | "soon" | "upcoming" {
  if (payment.paidAt) return "paid";
  const due = new Date(payment.dueDate);
  if (due < new Date()) return "overdue";
  if (due.getTime() - Date.now() < 14 * 24 * 60 * 60 * 1000) return "soon";
  return "upcoming";
}

const STATUS_STYLE = {
  paid:     "bg-green-50 text-green-700",
  overdue:  "bg-red-50 text-red-600",
  soon:     "bg-amber-50 text-amber-700",
  upcoming: "bg-gray-50 text-gray-500",
};

const STATUS_LABEL = {
  paid:     "Paid",
  overdue:  "Overdue",
  soon:     "Due soon",
  upcoming: "Upcoming",
};

export default function VendorPaymentsTab({ vendorId, initialPayments }: VendorPaymentsTabProps) {
  const [payments,    setPayments]    = useState<VendorPayment[]>(initialPayments);
  const [label,       setLabel]       = useState("");
  const [amount,      setAmount]      = useState("");
  const [dueDate,     setDueDate]     = useState("");
  const [notes,       setNotes]       = useState("");
  const [adding,      setAdding]      = useState(false);
  const [showForm,    setShowForm]    = useState(false);
  const [actionId,    setActionId]    = useState<string | null>(null);
  const [error,       setError]       = useState("");

  const sorted = [...payments].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  async function handleAdd() {
    if (!label.trim() || !amount || !dueDate) {
      setError("Label, amount, and due date are required.");
      return;
    }
    setError("");
    setAdding(true);
    try {
      const payment = await addVendorPaymentAction(vendorId, {
        label:   label.trim(),
        amount:  parseFloat(amount),
        dueDate: new Date(dueDate).toISOString(),
        notes:   notes.trim() || null,
      });
      setPayments((prev) => [...prev, payment as VendorPayment]);
      setLabel(""); setAmount(""); setDueDate(""); setNotes("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add payment.");
    } finally {
      setAdding(false);
    }
  }

  async function handleMarkPaid(id: string) {
    setActionId(id);
    try {
      await markVendorPaymentPaidAction(id);
      setPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, paidAt: new Date() } : p))
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(id: string) {
    setActionId(id);
    try {
      await deleteVendorPaymentAction(id);
      setPayments((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Payment list */}
      {sorted.length === 0 && !showForm ? (
        <div className="py-8 text-center">
          <svg className="w-8 h-8 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-gray-400">No payment milestones yet.</p>
          <p className="text-xs text-gray-300 mt-0.5">Track deposits and final payments here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((p) => {
            const st = paymentStatus(p);
            return (
              <div key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium text-gray-800 truncate">{p.label}</p>
                    <span className={cn("text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none shrink-0", STATUS_STYLE[st])}>
                      {STATUS_LABEL[st]}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    ${p.amount.toLocaleString()} · due {new Date(p.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {p.paidAt && ` · paid ${new Date(p.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                  </p>
                  {p.notes && <p className="text-[11px] text-gray-400 mt-0.5">{p.notes}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!p.paidAt && (
                    <button
                      type="button"
                      title="Mark paid"
                      disabled={actionId === p.id}
                      onClick={() => handleMarkPaid(p.id)}
                      className="text-[11px] font-medium text-green-600 hover:text-green-700 px-2 py-1 rounded-md hover:bg-green-50 transition-colors disabled:opacity-40"
                    >
                      Mark paid
                    </button>
                  )}
                  <button
                    type="button"
                    title="Delete"
                    disabled={actionId === p.id}
                    onClick={() => handleDelete(p.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add form */}
      {showForm ? (
        <div className="rounded-lg border border-gray-100 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New payment milestone</p>
          <Input
            label="Label *"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder='e.g. "Deposit" or "Final Payment"'
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount *"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
            <Input
              label="Due date *"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Payment instructions, bank details..."
              className="w-full px-4 py-3 rounded-md text-[15px] bg-gray-100 border-0 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 resize-none focus:bg-white focus:shadow-apple-sm focus:ring-2 focus:ring-accent/25"
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => { setShowForm(false); setError(""); }}>
              Cancel
            </Button>
            <Button type="button" variant="primary" size="sm" loading={adding} onClick={handleAdd}>
              Add milestone
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full py-2.5 rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-accent hover:text-accent transition-colors"
        >
          + Add payment milestone
        </button>
      )}
    </div>
  );
}
