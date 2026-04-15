"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import {
  addAccommodationAction,
  updateAccommodationAction,
  deleteAccommodationAction,
} from "@/lib/actions/accommodations";
import type { HotelBlock } from "@prisma/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AccommodationsClientProps {
  hotels: HotelBlock[];
}

interface FormState {
  name: string;
  address: string;
  bookingUrl: string;
  promoCode: string;
  roomsTotal: string;
  roomsBooked: string;
  pricePerNight: string;
  checkInDate: string;
  checkOutDate: string;
  deadline: string;
  notes: string;
}

const emptyForm = (): FormState => ({
  name: "",
  address: "",
  bookingUrl: "",
  promoCode: "",
  roomsTotal: "",
  roomsBooked: "0",
  pricePerNight: "",
  checkInDate: "",
  checkOutDate: "",
  deadline: "",
  notes: "",
});

function hotelToForm(h: HotelBlock): FormState {
  return {
    name: h.name,
    address: h.address ?? "",
    bookingUrl: h.bookingUrl ?? "",
    promoCode: h.promoCode ?? "",
    roomsTotal: h.roomsTotal != null ? String(h.roomsTotal) : "",
    roomsBooked: String(h.roomsBooked),
    pricePerNight: h.pricePerNight != null ? String(h.pricePerNight) : "",
    checkInDate: h.checkInDate ? toDateInputValue(h.checkInDate) : "",
    checkOutDate: h.checkOutDate ? toDateInputValue(h.checkOutDate) : "",
    deadline: h.deadline ? toDateInputValue(h.deadline) : "",
    notes: h.notes ?? "",
  };
}

function formToInput(f: FormState) {
  return {
    name: f.name.trim(),
    address: f.address.trim() || null,
    bookingUrl: f.bookingUrl.trim() || null,
    promoCode: f.promoCode.trim() || null,
    roomsTotal: f.roomsTotal ? parseInt(f.roomsTotal) : null,
    roomsBooked: f.roomsBooked ? parseInt(f.roomsBooked) : 0,
    pricePerNight: f.pricePerNight ? parseFloat(f.pricePerNight) : null,
    checkInDate: f.checkInDate || null,
    checkOutDate: f.checkOutDate || null,
    deadline: f.deadline || null,
    notes: f.notes.trim() || null,
  };
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function toDateInputValue(d: Date): string {
  return new Date(d).toISOString().split("T")[0];
}

function formatDateRange(checkIn?: Date | null, checkOut?: Date | null): string | null {
  if (!checkIn) return null;
  const inStr = new Date(checkIn).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  if (!checkOut) return inStr;
  const outDate = new Date(checkOut);
  const inDate = new Date(checkIn);
  const nights = Math.round(
    (outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const outStr = new Date(checkOut).toLocaleDateString("en-US", {
    month:
      outDate.getMonth() === inDate.getMonth() ? undefined : "short",
    day: "numeric",
  });
  return `${inStr} – ${outStr}${nights > 0 ? ` · ${nights} night${nights !== 1 ? "s" : ""}` : ""}`;
}

function deadlineStatus(deadline?: Date | null): "green" | "amber" | "red" | null {
  if (!deadline) return null;
  const now = Date.now();
  const dl = new Date(deadline).getTime();
  const days = Math.ceil((dl - now) / (1000 * 60 * 60 * 24));
  if (days < 0) return "red";
  if (days <= 6) return "amber";
  return "green";
}

function formatDeadline(deadline: Date): string {
  return new Date(deadline).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function HotelIcon() {
  return (
    <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
      <svg
        className="w-5 h-5 text-accent"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ── Hotel Form ────────────────────────────────────────────────────────────────

function HotelForm({
  form,
  onChange,
  onSave,
  onCancel,
  saving,
  error,
  isEdit,
}: {
  form: FormState;
  onChange: (patch: Partial<FormState>) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
  isEdit?: boolean;
}) {
  const field = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent bg-white transition-colors";
  const label = "block text-xs font-medium text-gray-500 mb-1";

  return (
    <div className="p-5 space-y-4">
      <p className="text-sm font-semibold text-gray-800">
        {isEdit ? "Edit Hotel Block" : "New Hotel Block"}
      </p>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Row 1: Name + Address */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Hotel Name <span className="text-red-400">*</span></label>
          <input
            autoFocus={!isEdit}
            value={form.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Grand Hyatt"
            className={field}
          />
        </div>
        <div>
          <label className={label}>Address <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            value={form.address}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder="123 Main St, City"
            className={field}
          />
        </div>
      </div>

      {/* Row 2: Booking URL + Promo Code */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Booking URL <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            type="url"
            value={form.bookingUrl}
            onChange={(e) => onChange({ bookingUrl: e.target.value })}
            placeholder="https://..."
            className={field}
          />
        </div>
        <div>
          <label className={label}>Promo Code <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            value={form.promoCode}
            onChange={(e) => onChange({ promoCode: e.target.value })}
            placeholder="WEDDING2025"
            className={cn(field, "font-mono uppercase tracking-wider")}
          />
        </div>
      </div>

      {/* Row 3: Rooms Reserved + Rooms Booked + Price/Night */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={label}>Rooms Reserved</label>
          <input
            type="number"
            min={0}
            value={form.roomsTotal}
            onChange={(e) => onChange({ roomsTotal: e.target.value })}
            placeholder="30"
            className={field}
          />
        </div>
        <div>
          <label className={label}>Rooms Booked</label>
          <input
            type="number"
            min={0}
            value={form.roomsBooked}
            onChange={(e) => onChange({ roomsBooked: e.target.value })}
            placeholder="0"
            className={field}
          />
        </div>
        <div>
          <label className={label}>Price / Night</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.pricePerNight}
              onChange={(e) => onChange({ pricePerNight: e.target.value })}
              placeholder="189"
              className={cn(field, "pl-6")}
            />
          </div>
        </div>
      </div>

      {/* Row 4: Check-In + Check-Out + Booking Deadline */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={label}>Check-In Date</label>
          <input
            type="date"
            value={form.checkInDate}
            onChange={(e) => onChange({ checkInDate: e.target.value })}
            className={field}
          />
        </div>
        <div>
          <label className={label}>Check-Out Date</label>
          <input
            type="date"
            value={form.checkOutDate}
            onChange={(e) => onChange({ checkOutDate: e.target.value })}
            className={field}
          />
        </div>
        <div>
          <label className={label}>Booking Deadline</label>
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => onChange({ deadline: e.target.value })}
            className={field}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={label}>Notes <span className="text-gray-400 font-normal">(optional)</span></label>
        <textarea
          value={form.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={2}
          placeholder="Mention shuttle service, parking details, or anything guests should know…"
          maxLength={500}
          className={cn(field, "resize-none")}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" variant="primary" loading={saving} onClick={onSave}>
          {isEdit ? "Save Changes" : "Add Hotel"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AccommodationsClient({ hotels }: AccommodationsClientProps) {
  const router = useRouter();

  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm());
  const [savingEditId, setSavingEditId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalRooms = hotels.reduce((s, h) => s + (h.roomsTotal ?? 0), 0);
  const bookedRooms = hotels.reduce((s, h) => s + h.roomsBooked, 0);
  const bookedPct = totalRooms > 0 ? Math.min(100, Math.round((bookedRooms / totalRooms) * 100)) : 0;

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleAdd() {
    if (!addForm.name.trim()) { setAddError("Hotel name is required."); return; }
    setSaving(true);
    setAddError(null);
    try {
      await addAccommodationAction(formToInput(addForm));
      setAdding(false);
      setAddForm(emptyForm());
      router.refresh();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Failed to add hotel.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit(id: string) {
    if (!editForm.name.trim()) { setEditError("Hotel name is required."); return; }
    setSavingEditId(id);
    setEditError(null);
    try {
      await updateAccommodationAction(id, formToInput(editForm));
      setEditingId(null);
      router.refresh();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Failed to update hotel.");
    } finally {
      setSavingEditId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this hotel block?")) return;
    setDeletingId(id);
    try {
      await deleteAccommodationAction(id);
      router.refresh();
    } catch {
      // silent — unlikely
    } finally {
      setDeletingId(null);
    }
  }

  function startEdit(h: HotelBlock) {
    setEditingId(h.id);
    setEditForm(hotelToForm(h));
    setEditError(null);
    setAdding(false);
  }

  function cancelAdd() {
    setAdding(false);
    setAddForm(emptyForm());
    setAddError(null);
  }

  function copyPromoCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1800);
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl space-y-6">

      {/* Stats bar */}
      {hotels.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {/* Hotels */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-apple-sm px-4 py-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Hotels</p>
            <p className="text-2xl font-semibold text-gray-900">{hotels.length}</p>
          </div>

          {/* Rooms Reserved */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-apple-sm px-4 py-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Rooms Reserved</p>
            <p className="text-2xl font-semibold text-gray-900">{totalRooms || "—"}</p>
          </div>

          {/* Rooms Booked */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-apple-sm px-4 py-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Rooms Booked</p>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-semibold text-gray-900">{bookedRooms}</p>
              {totalRooms > 0 && (
                <p className="text-sm text-gray-400 mb-0.5">/ {totalRooms}</p>
              )}
            </div>
            {totalRooms > 0 && (
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${bookedPct}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div />
        <Button
          size="sm"
          variant="primary"
          onClick={() => { cancelAdd(); setAdding(true); setEditingId(null); }}
          disabled={adding}
        >
          + Add Hotel
        </Button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {adding && (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-apple-md overflow-hidden"
          >
            <HotelForm
              form={addForm}
              onChange={(p) => setAddForm((f) => ({ ...f, ...p }))}
              onSave={handleAdd}
              onCancel={cancelAdd}
              saving={saving}
              error={addError}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {hotels.length === 0 && !adding && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200"
        >
          <div className="w-16 h-16 rounded-2xl bg-accent-light flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <p className="text-[15px] font-semibold text-gray-800 mb-1">No hotel blocks yet</p>
          <p className="text-sm text-gray-400 max-w-xs mb-6">
            Add a room block so guests know where to stay and how to book.
          </p>
          <Button size="sm" variant="primary" onClick={() => setAdding(true)}>
            + Add Hotel Block
          </Button>
        </motion.div>
      )}

      {/* Hotel cards */}
      <AnimatePresence mode="popLayout">
        {hotels.map((h) => {
          const isEditing = editingId === h.id;
          const dateRange = formatDateRange(h.checkInDate, h.checkOutDate);
          const dlStatus = deadlineStatus(h.deadline);
          const booked = h.roomsBooked;
          const total = h.roomsTotal ?? 0;
          const roomPct = total > 0 ? Math.min(100, Math.round((booked / total) * 100)) : 0;

          return (
            <motion.div
              key={h.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-apple-md overflow-hidden"
            >
              {isEditing ? (
                <HotelForm
                  form={editForm}
                  onChange={(p) => setEditForm((f) => ({ ...f, ...p }))}
                  onSave={() => handleSaveEdit(h.id)}
                  onCancel={() => { setEditingId(null); setEditError(null); }}
                  saving={savingEditId === h.id}
                  error={editError}
                  isEdit
                />
              ) : (
                <>
                  {/* Card body */}
                  <div className="p-5 flex gap-4">
                    {/* Left: icon + name */}
                    <div className="flex flex-col items-start gap-3 min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <HotelIcon />
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold text-gray-900 leading-tight">{h.name}</p>
                          {h.address && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <LocationIcon />
                              <p className="text-xs text-gray-400 truncate">{h.address}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Info chips */}
                      <div className="flex flex-wrap gap-2">
                        {dateRange && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">
                            <CalendarIcon />
                            {dateRange}
                          </span>
                        )}
                        {h.pricePerNight != null && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            ${h.pricePerNight.toFixed(0)} / night
                          </span>
                        )}
                        {h.promoCode && (
                          <button
                            onClick={() => copyPromoCode(h.promoCode!)}
                            title="Click to copy promo code"
                            className={cn(
                              "inline-flex items-center gap-1.5 text-xs font-mono tracking-wider rounded-lg px-2.5 py-1 border transition-colors",
                              copiedCode === h.promoCode
                                ? "bg-green-50 border-green-200 text-green-700"
                                : "bg-accent-light border-accent/20 text-accent hover:bg-accent hover:text-white"
                            )}
                          >
                            {copiedCode === h.promoCode ? (
                              <>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Copied!
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                {h.promoCode}
                              </>
                            )}
                          </button>
                        )}
                        {h.deadline && dlStatus && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1 border",
                              dlStatus === "green" && "bg-green-50 border-green-100 text-green-700",
                              dlStatus === "amber" && "bg-amber-50 border-amber-100 text-amber-700",
                              dlStatus === "red"   && "bg-red-50 border-red-100 text-red-600"
                            )}
                          >
                            <ClockIcon />
                            {dlStatus === "red" ? "Deadline passed · " : "Book by · "}
                            {formatDeadline(h.deadline)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: room meter + book button */}
                    <div className="flex flex-col items-end justify-between gap-3 shrink-0 min-w-[120px]">
                      {(total > 0 || booked > 0) && (
                        <div className="text-right w-full">
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                            Rooms
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            {booked}
                            {total > 0 && (
                              <span className="text-sm font-normal text-gray-400"> / {total}</span>
                            )}
                          </p>
                          {total > 0 && (
                            <div className="mt-1.5 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-accent rounded-full transition-all duration-500"
                                style={{ width: `${roomPct}%` }}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {h.bookingUrl && (
                        <a
                          href={h.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                        >
                          Book Now
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Footer strip */}
                  {(h.notes || true) && (
                    <div className="flex items-center justify-between gap-3 px-5 py-2.5 bg-gray-50 border-t border-gray-100">
                      <p className="text-xs text-gray-400 truncate flex-1">
                        {h.notes || ""}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Edit */}
                        <button
                          onClick={() => startEdit(h)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(h.id)}
                          disabled={deletingId === h.id}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
