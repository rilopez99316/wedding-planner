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

// ── Types ──────────────────────────────────────────────────────────────────

type Category = "venue" | "photographer" | "caterer" | "florist" | "dj" | "other";
type Tab = "info" | "packages" | "documents";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "venue",        label: "Venue" },
  { value: "photographer", label: "Photographer" },
  { value: "caterer",      label: "Caterer" },
  { value: "florist",      label: "Florist" },
  { value: "dj",           label: "DJ / Entertainment" },
  { value: "other",        label: "Other" },
];

interface PackageRow {
  id:         string | null; // null = unsaved
  name:       string;
  price:      string;
  capacity:   string;
  inclusions: string;
  notes:      string;
  _key:       string; // stable react key
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

// ── Component ──────────────────────────────────────────────────────────────

export default function AddVendorDialog({ open, onOpenChange, editingVendor, onSuccess }: AddVendorDialogProps) {
  const [tab,         setTab]         = useState<Tab>("info");
  const [category,    setCategory]    = useState<Category>("venue");
  const [name,        setName]        = useState("");
  const [contactName, setContactName] = useState("");
  const [email,       setEmail]       = useState("");
  const [phone,       setPhone]       = useState("");
  const [website,     setWebsite]     = useState("");
  const [notes,       setNotes]       = useState("");
  const [packages,       setPackages]       = useState<PackageRow[]>([emptyPackageRow()]);
  const [localDocuments, setLocalDocuments] = useState<VendorDocument[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");

  const isEditMode = !!editingVendor;

  // Populate on open
  useEffect(() => {
    if (editingVendor) {
      setCategory(editingVendor.category as Category);
      setName(editingVendor.name);
      setContactName(editingVendor.contactName ?? "");
      setEmail(editingVendor.email ?? "");
      setPhone(editingVendor.phone ?? "");
      setWebsite(editingVendor.website ?? "");
      setNotes(editingVendor.notes ?? "");
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
      name:        name.trim(),
      contactName: contactName.trim() || null,
      email:       email.trim() || null,
      phone:       phone.trim() || null,
      website:     website.trim() || null,
      notes:       notes.trim() || null,
    };

    setLoading(true);
    try {
      let vendor: VendorWithPackages;

      if (isEditMode && editingVendor) {
        vendor = await updateVendorAction(editingVendor.id, vendorPayload) as VendorWithPackages;
      } else {
        const created = await addVendorAction(vendorPayload);
        vendor = { ...created, packages: [], documents: [] };
      }

      // Sync packages
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
          // already handled server-side on updateVendorAction for existing
          // We need to update existing packages separately
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
                <div className="bg-white rounded-xl shadow-apple-xl w-full max-w-xl max-h-[90vh] flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <Dialog.Title className="text-[15px] font-semibold text-gray-900">
                      {isEditMode ? "Edit vendor" : "Add vendor"}
                    </Dialog.Title>
                    <Dialog.Close className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Dialog.Close>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-gray-100 px-6 shrink-0">
                    {(["info", "packages", "documents"] as Tab[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTab(t)}
                        className={cn(
                          "py-3 px-1 mr-5 text-sm font-medium border-b-2 -mb-px transition-colors",
                          tab === t
                            ? "border-accent text-accent"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        )}
                      >
                        {t === "info" ? "Info" : t === "packages" ? "Packages" : (
                          <span className="flex items-center gap-1.5">
                            Documents
                            {localDocuments.length > 0 && (
                              <span className="bg-accent text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none">
                                {localDocuments.length}
                              </span>
                            )}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Content */}
                  <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="overflow-y-auto flex-1 p-6 space-y-4">
                      {/* INFO TAB */}
                      {tab === "info" && (
                        <>
                          {/* Category */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-gray-600">Category *</label>
                            <div className="flex flex-wrap gap-2">
                              {CATEGORIES.map((c) => (
                                <button
                                  key={c.value}
                                  type="button"
                                  onClick={() => setCategory(c.value)}
                                  className={cn(
                                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
                                    category === c.value
                                      ? "bg-accent text-white shadow-sm"
                                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  )}
                                >
                                  {c.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Name */}
                          <Input
                            label="Vendor name *"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. The Grand Ballroom"
                            required
                          />

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

                          {/* Notes */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-gray-600">Notes</label>
                            <textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              rows={3}
                              placeholder="Availability, impressions, links to portfolios..."
                              className="w-full px-4 py-3 rounded-md text-[15px] bg-gray-100 border-0 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 resize-none focus:bg-white focus:shadow-apple-sm focus:ring-2 focus:ring-accent/25"
                            />
                          </div>
                        </>
                      )}

                      {/* PACKAGES TAB */}
                      {tab === "packages" && (
                        <div className="space-y-4">
                          {packages.map((row, i) => (
                            <div key={row._key} className="rounded-lg border border-gray-100 p-4 space-y-3 relative">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Package {i + 1}</span>
                                {packages.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removePackageRow(row)}
                                    className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
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
                            className="w-full py-2.5 rounded-lg border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-accent hover:text-accent transition-colors"
                          >
                            + Add another package
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
                          <div className="py-12 text-center text-sm text-gray-400">
                            Save the vendor first to attach documents.
                          </div>
                        )
                      )}
                    </div>

                    {/* Error + Footer */}
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
