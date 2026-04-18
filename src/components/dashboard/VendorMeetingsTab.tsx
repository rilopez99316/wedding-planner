"use client";

import { useState } from "react";
import type { VendorMeeting } from "@prisma/client";
import { addVendorMeetingAction, deleteVendorMeetingAction } from "@/lib/actions/vendors";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface VendorMeetingsTabProps {
  vendorId:        string;
  initialMeetings: VendorMeeting[];
}

export default function VendorMeetingsTab({ vendorId, initialMeetings }: VendorMeetingsTabProps) {
  const [meetings,  setMeetings]  = useState<VendorMeeting[]>(initialMeetings);
  const [date,      setDate]      = useState("");
  const [notes,     setNotes]     = useState("");
  const [adding,    setAdding]    = useState(false);
  const [showForm,  setShowForm]  = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error,     setError]     = useState("");

  const sorted = [...meetings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  async function handleAdd() {
    if (!date || !notes.trim()) {
      setError("Date and notes are required.");
      return;
    }
    setError("");
    setAdding(true);
    try {
      const meeting = await addVendorMeetingAction(vendorId, {
        date:  new Date(date).toISOString(),
        notes: notes.trim(),
      });
      setMeetings((prev) => [...prev, meeting as VendorMeeting]);
      setDate(""); setNotes("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add meeting.");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteVendorMeetingAction(id);
      setMeetings((prev) => prev.filter((m) => m.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Meeting list */}
      {sorted.length === 0 && !showForm ? (
        <div className="py-8 text-center">
          <svg className="w-8 h-8 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
          </svg>
          <p className="text-sm text-gray-400">No meetings logged yet.</p>
          <p className="text-xs text-gray-300 mt-0.5">Capture notes from site visits and calls.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((m) => (
            <div key={m.id} className="bg-gray-50 rounded-lg px-3 py-3 group relative">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[12px] font-semibold text-gray-500">
                  {new Date(m.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                </p>
                <button
                  type="button"
                  title="Delete meeting"
                  disabled={deletingId === m.id}
                  onClick={() => handleDelete(m.id)}
                  className="w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 shrink-0"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <p className="text-[13px] text-gray-700 mt-1 whitespace-pre-wrap">{m.notes}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm ? (
        <div className="rounded-lg border border-gray-100 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Log a meeting</p>
          <Input
            label="Date *"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">Notes *</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="What was discussed? Any concerns, next steps, or impressions..."
              className="w-full px-4 py-3 rounded-md text-[15px] bg-gray-100 border-0 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 resize-none focus:bg-white focus:shadow-apple-sm focus:ring-2 focus:ring-accent/25"
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => { setShowForm(false); setError(""); }}>
              Cancel
            </Button>
            <Button type="button" variant="primary" size="sm" loading={adding} onClick={handleAdd}>
              Save meeting
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full py-2.5 rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-accent hover:text-accent transition-colors"
        >
          + Log a meeting
        </button>
      )}
    </div>
  );
}
