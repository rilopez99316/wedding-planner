"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { addVendorAction, updateVendorAction, addPackageAction, deletePackageAction } from "@/lib/actions/vendors";
import type { VendorWithPackages } from "@/components/dashboard/VendorCard";
import type { VendorDocument, VendorPackage } from "@prisma/client";
import VendorDocumentsTab from "@/components/dashboard/VendorDocumentsTab";
import VendorPaymentsTab from "@/components/dashboard/VendorPaymentsTab";
import VendorMeetingsTab from "@/components/dashboard/VendorMeetingsTab";

// ── Types ──────────────────────────────────────────────────────────────────

type Category = "venue" | "photographer" | "caterer" | "florist" | "dj" | "officiant" | "hairMakeup" | "transportation" | "cake" | "stationery" | "other";
type Tab = "info" | "packages" | "documents" | "payments" | "meetings";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "venue",          label: "Venue" },
  { value: "photographer",   label: "Photographer" },
  { value: "caterer",        label: "Caterer" },
  { value: "florist",        label: "Florist" },
  { value: "dj",             label: "DJ / Entertainment" },
  { value: "officiant",      label: "Officiant" },
  { value: "hairMakeup",     label: "Hair & Makeup" },
  { value: "transportation", label: "Transportation" },
  { value: "cake",           label: "Cake" },
  { value: "stationery",     label: "Stationery" },
  { value: "other",          label: "Other" },
];

const TAB_CONFIG: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: "info",
    label: "Info",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 16v-4m0-4h.01" />
      </svg>
    ),
  },
  {
    key: "packages",
    label: "Packages",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7m8 4v10" />
      </svg>
    ),
  },
  {
    key: "documents",
    label: "Documents",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    key: "payments",
    label: "Payments",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    key: "meetings",
    label: "Meetings",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

interface PackageRow {
  id:         string | null;
  name:       string;
  price:      string;
  capacity:   string;
  inclusions: string;
  notes:      string;
  _key:       string;
}

function emptyPackageRow(): PackageRow {
  return { id: null, name: "", price: "", capacity: "", inclusions: "", notes: "", _key: Math.random().toString(36).slice(2) };
}

interface AddVendorDialogProps {
  open:        boolean;
  onOpenChange: (open: boolean) => void;
  editingVendor: VendorWithPackages | null;
  onSuccess:   (vendor: VendorWithPackages) => void;
}

// ── Empty state for locked tabs ────────────────────────────────────────────

function LockedTabState({ message }: { message: string }) {
  return (
    <div className="py-16 flex flex-col items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
        <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <p className="font-serif text-base text-gray-500">Not available yet</p>
      <p className="text-xs text-gray-400 text-center max-w-[200px]">{message}</p>
    </div>
  );
}

// ── Section divider ────────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-gray-400">{label}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export default function AddVendorDialog({ open, onOpenChange, editingVendor, onSuccess }: AddVendorDialogProps) {
  const [tab,             setTab]             = useState<Tab>("info");
  const [category,        setCategory]        = useState<Category>("venue");
  const [name,            setName]            = useState("");
  const [contactName,     setContactName]     = useState("");
  const [email,           setEmail]           = useState("");
  const [phone,           setPhone]           = useState("");
  const [website,         setWebsite]         = useState("");
  const [notes,           setNotes]           = useState("");
  const [lastContactedAt, setLastContactedAt] = useState("");
  const [followUpDate,    setFollowUpDate]    = useState("");
  const [packages,        setPackages]        = useState<PackageRow[]>([emptyPackageRow()]);
  const [localDocuments,  setLocalDocuments]  = useState<VendorDocument[]>([]);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");

  const isEditMode = !!editingVendor;

  useEffect(() => {
    if (editingVendor) {
      setCategory(editingVendor.category as Category);
      setName(editingVendor.name);
      setContactName(editingVendor.contactName ?? "");
      setEmail(editingVendor.email ?? "");
      setPhone(editingVendor.phone ?? "");
      setWebsite(editingVendor.website ?? "");
      setNotes(editingVendor.notes ?? "");
      setLastContactedAt(
        editingVendor.lastContactedAt
          ? new Date(editingVendor.lastContactedAt).toISOString().split("T")[0]
          : ""
      );
      setFollowUpDate(
        editingVendor.followUpDate
          ? new Date(editingVendor.followUpDate).toISOString().split("T")[0]
          : ""
      );
      setPackages(
        editingVendor.packages.length > 0
          ? editingVendor.packages.map((p) => ({
              id:         p.id,
              name:       p.name,
              price:      p.price != null ? String(p.price) : "",
              capacity:   p.capacity != null ? String(p.capacity) : "",
              inclusions: p.inclusions ?? "",
              notes:      p.notes ?? "",
              _key:       p.id,
            }))
          : [emptyPackageRow()]
      );
      setLocalDocuments(editingVendor.documents ?? []);
    } else {
      setCategory("venue");
      setName("");
      setContactName("");
      setEmail("");
      setPhone("");
      setWebsite("");
      setNotes("");
      setLastContactedAt("");
      setFollowUpDate("");
      setPackages([emptyPackageRow()]);
      setLocalDocuments([]);
    }
    setTab("info");
    setError("");
  }, [editingVendor, open]);

  function updatePackageField(key: string, field: keyof PackageRow, value: string) {
    setPackages((prev) => prev.map((p) => (p._key === key ? { ...p, [field]: value } : p)));
  }

  function addPackageRow() {
    setPackages((prev) => [...prev, emptyPackageRow()]);
  }

  async function removePackageRow(row: PackageRow) {
    if (row.id) {
      await deletePackageAction(row.id);
    }
    setPackages((prev) => prev.filter((p) => p._key !== row._key));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const vendorPayload = {
      category,
      name:            name.trim(),
      contactName:     contactName.trim() || null,
      email:           email.trim() || null,
      phone:           phone.trim() || null,
      website:         website.trim() || null,
      notes:           notes.trim() || null,
      lastContactedAt: lastContactedAt ? new Date(lastContactedAt).toISOString() : null,
      followUpDate:    followUpDate ? new Date(followUpDate).toISOString() : null,
    };

    setLoading(true);
    try {
      let vendor: VendorWithPackages;

      if (isEditMode && editingVendor) {
        vendor = await updateVendorAction(editingVendor.id, vendorPayload) as VendorWithPackages;
      } else {
        const created = await addVendorAction(vendorPayload);
        vendor = { ...created, packages: [], documents: [], payments: [], meetings: [], budgetItems: [] };
      }

      const filledRows = packages.filter((p) => p.name.trim());
      for (const row of filledRows) {
        const pkgPayload = {
          name:       row.name.trim(),
          price:      row.price !== "" ? parseFloat(row.price) : null,
          capacity:   row.capacity !== "" ? parseInt(row.capacity, 10) : null,
          inclusions: row.inclusions.trim() || null,
          notes:      row.notes.trim() || null,
        };
        if (row.id) {
          const { updatePackageAction } = await import("@/lib/actions/vendors");
          await updatePackageAction(row.id, pkgPayload);
        } else {
          const pkg = await addPackageAction(vendor.id, pkgPayload);
          vendor.packages.push(pkg as VendorPackage);
        }
      }

      onSuccess({ ...vendor, documents: localDocuments });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // Badge counts
  const docsBadge    = localDocuments.length > 0 ? localDocuments.length : null;
  const paymentsBadge = isEditMode && editingVendor
    ? (editingVendor.payments ?? []).filter((p) => !p.paidAt).length || null
    : null;

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
                className="fixed inset-0 bg-black/25 backdrop-blur-sm z-50"
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
                <div className="bg-white rounded-xl shadow-apple-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">

                  {/* Accent gradient bar */}
                  <div className="h-[3px] bg-gradient-to-r from-accent to-accent-dark shrink-0 rounded-t-xl" />

                  {/* Header */}
                  <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <div>
                      <Dialog.Title className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">
                        {isEditMode ? "Edit vendor" : "Add vendor"}
                      </Dialog.Title>
                      {isEditMode && editingVendor && (
                        <p className="font-serif text-[18px] text-gray-800 mt-0.5 leading-tight">
                          {editingVendor.name}
                        </p>
                      )}
                    </div>
                    <Dialog.Close className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors mt-0.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Dialog.Close>
                  </div>

                  {/* Tabs */}
                  <div className="relative flex border-b border-gray-100 px-4 shrink-0 overflow-x-auto">
                    {TAB_CONFIG.map(({ key, label, icon }) => {
                      const badge = key === "documents" ? docsBadge : key === "payments" ? paymentsBadge : null;
                      const isActive = tab === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setTab(key)}
                          className={cn(
                            "relative py-3 px-3 mr-1 text-[13px] font-medium -mb-px transition-colors shrink-0 flex items-center gap-1.5",
                            isActive ? "text-accent" : "text-gray-400 hover:text-gray-600"
                          )}
                        >
                          <span className={cn("transition-colors", isActive ? "text-accent" : "text-gray-400")}>
                            {icon}
                          </span>
                          {label}
                          {badge != null && (
                            <span className="bg-accent text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none">
                              {badge}
                            </span>
                          )}
                          {isActive && (
                            <motion.span
                              layoutId="tab-underline"
                              className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent rounded-full"
                              transition={{ type: "spring", stiffness: 400, damping: 35 }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Content */}
                  <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="overflow-y-auto flex-1 p-6 space-y-4">

                      {/* INFO TAB */}
                      {tab === "info" && (
                        <>
                          {/* Category */}
                          <div className="flex flex-col gap-2">
                            <label className="font-serif text-[13px] tracking-wide text-gray-500">Category *</label>
                            <div className="flex flex-wrap gap-1.5">
                              {CATEGORIES.map((c) => (
                                <button
                                  key={c.value}
                                  type="button"
                                  onClick={() => setCategory(c.value)}
                                  className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 flex items-center gap-1",
                                    category === c.value
                                      ? "border border-accent bg-accent/[0.08] text-accent"
                                      : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                  )}
                                >
                                  {category === c.value && (
                                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                  {c.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Vendor name — hero field */}
                          <div className="flex flex-col gap-1.5">
                            <label className="font-serif text-[13px] tracking-wide text-gray-500">Vendor name *</label>
                            <div className="relative">
                              <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. The Grand Ballroom"
                                required
                                className="w-full px-0 py-2 text-[20px] font-serif text-gray-900 bg-transparent border-0 border-b-2 border-gray-200 placeholder:text-gray-300 outline-none transition-colors duration-200 focus:border-accent"
                              />
                            </div>
                          </div>

                          <SectionDivider label="Contact" />

                          {/* Contact + Email */}
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              label="Contact name"
                              value={contactName}
                              onChange={(e) => setContactName(e.target.value)}
                              placeholder="e.g. Jane Smith"
                            />
                            <Input
                              label="Email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="vendor@example.com"
                            />
                          </div>

                          {/* Phone + Website */}
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              label="Phone"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="(555) 000-0000"
                            />
                            <Input
                              label="Website"
                              value={website}
                              onChange={(e) => setWebsite(e.target.value)}
                              placeholder="https://..."
                            />
                          </div>

                          <SectionDivider label="Follow-up" />

                          {/* Last contacted + Follow-up */}
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              label="Last contacted"
                              type="date"
                              value={lastContactedAt}
                              onChange={(e) => setLastContactedAt(e.target.value)}
                            />
                            <Input
                              label="Follow-up by"
                              type="date"
                              value={followUpDate}
                              onChange={(e) => setFollowUpDate(e.target.value)}
                            />
                          </div>

                          <SectionDivider label="Notes" />

                          {/* Notes */}
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Availability, impressions, links to portfolios..."
                            className="w-full px-4 py-3 rounded-md text-[15px] bg-gray-100 border-0 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 resize-none focus:bg-white focus:shadow-apple-sm focus:ring-2 focus:ring-accent/25"
                          />
                        </>
                      )}

                      {/* PACKAGES TAB */}
                      {tab === "packages" && (
                        <div className="space-y-4">
                          {packages.map((row, i) => (
                            <div
                              key={row._key}
                              className="rounded-lg border border-gray-200 shadow-apple-xs border-l-2 border-l-accent p-4 space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-serif text-base text-gray-600">Package {i + 1}</span>
                                {packages.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removePackageRow(row)}
                                    className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </div>

                              <Input
                                label="Package name *"
                                value={row.name}
                                onChange={(e) => updatePackageField(row._key, "name", e.target.value)}
                                placeholder='e.g. "Gold Package" or "All-Inclusive"'
                              />

                              <div className="grid grid-cols-2 gap-3">
                                <Input
                                  label="Price"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={row.price}
                                  onChange={(e) => updatePackageField(row._key, "price", e.target.value)}
                                  placeholder="0"
                                />
                                <Input
                                  label="Capacity (guests)"
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={row.capacity}
                                  onChange={(e) => updatePackageField(row._key, "capacity", e.target.value)}
                                  placeholder="e.g. 150"
                                />
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-gray-600">Inclusions</label>
                                <textarea
                                  value={row.inclusions}
                                  onChange={(e) => updatePackageField(row._key, "inclusions", e.target.value)}
                                  rows={2}
                                  placeholder="Catering, AV equipment, parking, setup..."
                                  className="w-full px-4 py-3 rounded-md text-[15px] bg-gray-100 border-0 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 resize-none focus:bg-white focus:shadow-apple-sm focus:ring-2 focus:ring-accent/25"
                                />
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium text-gray-600">Package notes</label>
                                <textarea
                                  value={row.notes}
                                  onChange={(e) => updatePackageField(row._key, "notes", e.target.value)}
                                  rows={1}
                                  placeholder="Deposit required, seasonal pricing..."
                                  className="w-full px-4 py-3 rounded-md text-[15px] bg-gray-100 border-0 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 resize-none focus:bg-white focus:shadow-apple-sm focus:ring-2 focus:ring-accent/25"
                                />
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={addPackageRow}
                            className="w-full py-3 rounded-full border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-accent hover:text-accent hover:bg-accent/[0.03] transition-all duration-150 flex items-center justify-center gap-1.5"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Add another package
                          </button>
                        </div>
                      )}

                      {/* DOCUMENTS TAB */}
                      {tab === "documents" && (
                        isEditMode && editingVendor ? (
                          <VendorDocumentsTab
                            vendorId={editingVendor.id}
                            documents={localDocuments}
                            onChange={setLocalDocuments}
                          />
                        ) : (
                          <LockedTabState message="Save the vendor first to attach documents." />
                        )
                      )}

                      {/* PAYMENTS TAB */}
                      {tab === "payments" && (
                        isEditMode && editingVendor ? (
                          <VendorPaymentsTab vendorId={editingVendor.id} initialPayments={editingVendor.payments} />
                        ) : (
                          <LockedTabState message="Save the vendor first to add payment milestones." />
                        )
                      )}

                      {/* MEETINGS TAB */}
                      {tab === "meetings" && (
                        isEditMode && editingVendor ? (
                          <VendorMeetingsTab vendorId={editingVendor.id} initialMeetings={editingVendor.meetings} />
                        ) : (
                          <LockedTabState message="Save the vendor first to log meeting notes." />
                        )
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-5 pt-4 border-t border-gray-100 bg-gray-50/60 shrink-0 space-y-3">
                      {error && (
                        <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
                      )}
                      <div className="flex gap-3">
                        <Dialog.Close asChild>
                          <button
                            type="button"
                            className="flex-1 px-4 py-2.5 rounded-md text-[15px] font-medium text-gray-500 hover:text-gray-700 bg-transparent hover:bg-gray-100 transition-colors duration-150"
                          >
                            Cancel
                          </button>
                        </Dialog.Close>
                        <Button type="submit" variant="primary" size="md" loading={loading} className="flex-1">
                          {isEditMode ? "Save changes" : "Add vendor"}
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
