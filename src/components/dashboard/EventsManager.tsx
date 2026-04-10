"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addEventAction, updateEventAction, deleteEventAction } from "@/lib/actions/settings";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface EventRow {
  id: string;
  key: string;
  label: string;
  date: string;
  location: string;
  notes: string;
  order: number;
}

interface EventsManagerProps {
  weddingSlug: string;
  events: EventRow[];
}

const blank: Omit<EventRow, "id"> = {
  key:      "",
  label:    "",
  date:     "",
  location: "",
  notes:    "",
  order:    0,
};

export default function EventsManager({ events: initial }: EventsManagerProps) {
  const [events, setEvents] = useState<EventRow[]>(initial);
  const [adding, setAdding] = useState(false);
  const [newEvent, setNewEvent] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Omit<EventRow, "id">>(blank);
  const [error, setError] = useState<string | null>(null);

  function setNew(field: keyof typeof blank, value: string | number) {
    setNewEvent((prev) => ({ ...prev, [field]: value }));
  }

  function setEdit(field: keyof typeof blank, value: string | number) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAdd() {
    setSaving(true);
    setError(null);
    try {
      await addEventAction({ ...newEvent, order: events.length });
      // Reload by adding optimistically — page revalidation will sync on next nav
      setEvents((prev) => [...prev, { ...newEvent, id: Date.now().toString(), order: prev.length }]);
      setNewEvent(blank);
      setAdding(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add event.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(event: EventRow) {
    setEditingId(event.id);
    setEditForm({
      key:      event.key,
      label:    event.label,
      date:     event.date,
      location: event.location,
      notes:    event.notes,
      order:    event.order,
    });
  }

  async function handleUpdate(eventId: string) {
    setSaving(true);
    setError(null);
    try {
      await updateEventAction(eventId, editForm);
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, ...editForm } : e))
      );
      setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update event.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(eventId: string) {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    try {
      await deleteEventAction(eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete event.");
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      {error && (
        <p className="text-sm text-red-500 font-sans px-1">{error}</p>
      )}

      {events.length === 0 && !adding && (
        <div className="bg-white rounded-[16px] shadow-apple-sm px-6 py-10 text-center space-y-2">
          <p className="text-sm font-semibold text-gray-700">No events yet</p>
          <p className="text-xs text-gray-400">Add your ceremony, reception, and other events.</p>
        </div>
      )}

      <AnimatePresence>
        {events.map((event) => (
          <motion.div
            key={event.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-white rounded-[16px] shadow-apple-sm overflow-hidden"
          >
            {editingId === event.id ? (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Event key (URL-safe)"
                    placeholder="e.g. ceremony"
                    value={editForm.key}
                    onChange={(e) => setEdit("key", e.target.value)}
                    hint="Lowercase letters, numbers, hyphens only"
                  />
                  <Input
                    label="Label"
                    placeholder="e.g. Ceremony"
                    value={editForm.label}
                    onChange={(e) => setEdit("label", e.target.value)}
                  />
                </div>
                <Input
                  type="datetime-local"
                  label="Date & time"
                  value={editForm.date}
                  onChange={(e) => setEdit("date", e.target.value)}
                />
                <Input
                  label="Location (optional)"
                  placeholder="e.g. Garden Terrace"
                  value={editForm.location}
                  onChange={(e) => setEdit("location", e.target.value)}
                />
                <Input
                  label="Notes (optional)"
                  placeholder="Attire, parking, etc."
                  value={editForm.notes}
                  onChange={(e) => setEdit("notes", e.target.value)}
                />
                <div className="flex gap-3 pt-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" loading={saving} onClick={() => handleUpdate(event.id)}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-gray-900">{event.label}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(event.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      year:    "numeric",
                      month:   "short",
                      day:     "numeric",
                      hour:    "numeric",
                      minute:  "2-digit",
                    })}
                    {event.location && <> · {event.location}</>}
                  </p>
                  {event.notes && (
                    <p className="text-xs text-gray-300 italic">{event.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => startEdit(event)}
                    className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    Edit
                  </button>
                  <span className="text-gray-200">|</span>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add event form */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-white rounded-[16px] shadow-apple-sm p-6 space-y-4"
          >
            <h3 className="text-sm font-semibold text-gray-900">New event</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Event key (URL-safe)"
                placeholder="e.g. ceremony"
                value={newEvent.key}
                onChange={(e) => setNew("key", e.target.value)}
                hint="Lowercase letters, numbers, hyphens only"
              />
              <Input
                label="Label"
                placeholder="e.g. Ceremony"
                value={newEvent.label}
                onChange={(e) => setNew("label", e.target.value)}
              />
            </div>
            <Input
              type="datetime-local"
              label="Date & time"
              value={newEvent.date}
              onChange={(e) => setNew("date", e.target.value)}
            />
            <Input
              label="Location (optional)"
              placeholder="e.g. Garden Terrace"
              value={newEvent.location}
              onChange={(e) => setNew("location", e.target.value)}
            />
            <Input
              label="Notes (optional)"
              placeholder="Attire, parking, etc."
              value={newEvent.notes}
              onChange={(e) => setNew("notes", e.target.value)}
            />
            <div className="flex gap-3 pt-1">
              <Button variant="ghost" size="sm" onClick={() => { setAdding(false); setNewEvent(blank); }}>
                Cancel
              </Button>
              <Button size="sm" loading={saving} onClick={handleAdd}>
                Add event
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!adding && (
        <Button variant="secondary" onClick={() => setAdding(true)}>
          + Add event
        </Button>
      )}
    </div>
  );
}
