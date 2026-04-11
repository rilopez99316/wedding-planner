"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  addTimelineEventAction,
  updateTimelineEventAction,
} from "@/lib/actions/timeline";
import {
  TIMELINE_CATEGORY_ORDER,
  TIMELINE_CATEGORY_LABELS,
  TIMELINE_CATEGORY_COLORS,
  TIMELINE_CATEGORY_ICONS,
  type TimelineCategory,
} from "@/lib/timeline-constants";

// ── Types ──────────────────────────────────────────────────────────────────

export type TimelineEventRow = {
  id:         string;
  title:      string;
  startTime:  string; // ISO string
  endTime:    string | null; // ISO string or null
  category:   string;
  location:   string | null;
  assignedTo: string | null;
  notes:      string | null;
  order:      number;
};

interface AddTimelineEventDialogProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  editingEvent: TimelineEventRow | null;
  weddingDate:  Date;
  onSuccess:    (event: TimelineEventRow) => void;
}

// ── Helper ─────────────────────────────────────────────────────────────────

function toTimeStr(iso: string): string {
  // Extract HH:mm in local time from an ISO string
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function buildFullDateTime(weddingDate: Date, timeStr: string): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(weddingDate);
  d.setHours(h, m, 0, 0);
  return d;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function AddTimelineEventDialog({
  open,
  onOpenChange,
  editingEvent,
  weddingDate,
  onSuccess,
}: AddTimelineEventDialogProps) {
  const [title,        setTitle]        = useState("");
  const [startTimeStr, setStartTimeStr] = useState("09:00");
  const [endTimeStr,   setEndTimeStr]   = useState("");
  const [category,     setCategory]     = useState<TimelineCategory>("getting_ready");
  const [location,     setLocation]     = useState("");
  const [assignedTo,   setAssignedTo]   = useState("");
  const [notes,        setNotes]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  const isEditMode = !!editingEvent;

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setStartTimeStr(toTimeStr(editingEvent.startTime));
      setEndTimeStr(editingEvent.endTime ? toTimeStr(editingEvent.endTime) : "");
      setCategory(editingEvent.category as TimelineCategory);
      setLocation(editingEvent.location ?? "");
      setAssignedTo(editingEvent.assignedTo ?? "");
      setNotes(editingEvent.notes ?? "");
    } else {
      setTitle("");
      setStartTimeStr("09:00");
      setEndTimeStr("");
      setCategory("getting_ready");
      setLocation("");
      setAssignedTo("");
      setNotes("");
    }
    setError("");
  }, [editingEvent, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!startTimeStr) {
      setError("Start time is required.");
      return;
    }

    const startDateTime = buildFullDateTime(weddingDate, startTimeStr);
    const endDateTime   = endTimeStr ? buildFullDateTime(weddingDate, endTimeStr) : null;

    const formData = {
      title:      title.trim(),
      startTime:  startDateTime.toISOString(),
      endTime:    endDateTime?.toISOString() ?? null,
      category,
      location:   location.trim()   || null,
      assignedTo: assignedTo.trim() || null,
      notes:      notes.trim()      || null,
    };

    setLoading(true);
    try {
      let saved;
      if (isEditMode && editingEvent) {
        saved = await updateTimelineEventAction(editingEvent.id, formData);
      } else {
        saved = await addTimelineEventAction(formData);
      }

      onSuccess({
        id:         saved.id,
        title:      saved.title,
        startTime:  saved.startTime.toISOString(),
        endTime:    saved.endTime?.toISOString() ?? null,
        category:   saved.category,
        location:   saved.location,
        assignedTo: saved.assignedTo,
        notes:      saved.notes,
        order:      saved.order,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

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
                <div className="bg-white rounded-xl shadow-apple-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <Dialog.Title className="text-[15px] font-semibold text-gray-900">
                      {isEditMode ? "Edit event" : "Add event"}
                    </Dialog.Title>
                    <Dialog.Close className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Dialog.Close>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="overflow-y-auto flex-1 p-6 space-y-4">

                      {/* Title */}
                      <Input
                        label="Event title *"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Ceremony begins"
                        required
                        autoFocus
                      />

                      {/* Category chips */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-medium text-gray-600">Category *</label>
                        <div className="flex flex-wrap gap-2">
                          {TIMELINE_CATEGORY_ORDER.map((cat) => {
                            const color    = TIMELINE_CATEGORY_COLORS[cat];
                            const icon     = TIMELINE_CATEGORY_ICONS[cat];
                            const label    = TIMELINE_CATEGORY_LABELS[cat];
                            const isActive = category === cat;
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setCategory(cat)}
                                className={cn(
                                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border",
                                  isActive
                                    ? "border-transparent text-white shadow-sm"
                                    : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                                )}
                                style={isActive ? { backgroundColor: color } : undefined}
                              >
                                <span>{icon}</span>
                                <span>{label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Start / End time */}
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Start time *"
                          type="time"
                          value={startTimeStr}
                          onChange={(e) => setStartTimeStr(e.target.value)}
                          required
                        />
                        <div className="flex flex-col gap-1.5">
                          <Input
                            label="End time"
                            type="time"
                            value={endTimeStr}
                            onChange={(e) => setEndTimeStr(e.target.value)}
                          />
                          <p className="text-[11px] text-gray-400">Leave blank if open-ended</p>
                        </div>
                      </div>

                      {/* Location */}
                      <Input
                        label="Location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. St. Patrick's Cathedral"
                      />

                      {/* Assigned to */}
                      <Input
                        label="Assigned to"
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        placeholder="e.g. Photographer, MOH, Catering team"
                      />

                      {/* Notes */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-600">Notes</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                          maxLength={2000}
                          placeholder="Any details, reminders, or instructions..."
                          className="w-full px-4 py-3 rounded-md text-[15px] bg-gray-100 border-0 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 resize-none focus:bg-white focus:shadow-apple-sm focus:ring-2 focus:ring-accent/25"
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-6 pt-4 border-t border-gray-100 shrink-0 space-y-3">
                      {error && (
                        <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
                      )}
                      <div className="flex gap-3">
                        <Dialog.Close asChild>
                          <Button type="button" variant="secondary" size="md" className="flex-1">
                            Cancel
                          </Button>
                        </Dialog.Close>
                        <Button type="submit" variant="primary" size="md" loading={loading} className="flex-1">
                          {isEditMode ? "Save changes" : "Add event"}
                        </Button>
                      </div>
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
