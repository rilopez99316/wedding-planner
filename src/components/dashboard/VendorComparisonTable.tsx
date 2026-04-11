"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { updateVendorStatusAction } from "@/lib/actions/vendors";
import type { VendorWithPackages } from "@/components/dashboard/VendorCard";
import type { VendorPackage } from "@prisma/client";

// ── Types ──────────────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<string, string> = {
  venue:        "Venue",
  photographer: "Photographer",
  caterer:      "Caterer",
  florist:      "Florist",
  dj:           "DJ",
  other:        "Other",
};

interface VendorComparisonTableProps {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  vendors:       VendorWithPackages[];
  onBook:        (vendorId: string) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(price: number | null | undefined): string {
  if (price == null) return "—";
  return `$${price.toLocaleString()}`;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="divide-x divide-gray-100">
      <td className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 w-32 align-top">
        {label}
      </td>
      {children}
    </tr>
  );
}

function Cell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn("py-3 px-4 text-[13px] text-gray-700 align-top", className)}>
      {children}
    </td>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export default function VendorComparisonTable({ open, onOpenChange, vendors, onBook }: VendorComparisonTableProps) {
  // Track selected package per vendor (default to first package)
  const [selectedPkgIds, setSelectedPkgIds] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    vendors.forEach((v) => {
      if (v.packages.length > 0) map[v.id] = v.packages[0].id;
    });
    return map;
  });
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Update selection when vendors change
  const getPackage = (vendor: VendorWithPackages): VendorPackage | null => {
    if (vendor.packages.length === 0) return null;
    const pkgId = selectedPkgIds[vendor.id];
    return vendor.packages.find((p) => p.id === pkgId) ?? vendor.packages[0];
  };

  async function handleBook(vendorId: string) {
    setBookingId(vendorId);
    try {
      await updateVendorStatusAction(vendorId, "booked");
      onBook(vendorId);
      onOpenChange(false);
    } finally {
      setBookingId(null);
    }
  }

  const category = vendors[0]?.category ?? "";

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
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
              />
            </Dialog.Overlay>

            {/* Dialog — full screen on mobile, large centered on desktop */}
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 8 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed inset-0 flex items-center justify-center z-50 p-4"
              >
                <div className="bg-white rounded-xl shadow-apple-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <div>
                      <Dialog.Title className="text-[15px] font-semibold text-gray-900">
                        Compare {CATEGORY_LABEL[category] ?? "Vendors"}
                      </Dialog.Title>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {vendors.length} vendors selected
                      </p>
                    </div>
                    <Dialog.Close className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Dialog.Close>
                  </div>

                  {/* Scrollable table */}
                  <div className="overflow-auto flex-1">
                    <table className="w-full border-collapse text-sm">
                      {/* Vendor header row */}
                      <thead>
                        <tr className="divide-x divide-gray-100">
                          <th className="bg-gray-50 w-32" />
                          {vendors.map((v) => (
                            <th key={v.id} className="py-4 px-4 text-left bg-gray-50 border-b border-gray-100 align-top">
                              <div className="font-semibold text-[15px] text-gray-900">{v.name}</div>
                              <div className="mt-1 flex items-center gap-2">
                                <span className="text-[11px] text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                                  {CATEGORY_LABEL[v.category] ?? v.category}
                                </span>
                                <span
                                  className={cn(
                                    "text-[11px] rounded-full px-2 py-0.5",
                                    v.status === "booked"      && "bg-green-50 text-green-700",
                                    v.status === "shortlisted" && "bg-amber-50 text-amber-700",
                                    v.status === "rejected"    && "bg-red-50 text-red-600",
                                    v.status === "prospect"    && "bg-gray-100 text-gray-600"
                                  )}
                                >
                                  {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                                </span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-50">
                        {/* Package selector */}
                        <Row label="Package">
                          {vendors.map((v) => (
                            <Cell key={v.id}>
                              {v.packages.length === 0 ? (
                                <span className="text-gray-400 italic">No packages</span>
                              ) : v.packages.length === 1 ? (
                                <span>{v.packages[0].name}</span>
                              ) : (
                                <select
                                  value={selectedPkgIds[v.id] ?? v.packages[0].id}
                                  onChange={(e) =>
                                    setSelectedPkgIds((prev) => ({ ...prev, [v.id]: e.target.value }))
                                  }
                                  className="w-full px-2 py-1.5 rounded-md text-[13px] bg-gray-100 border-0 text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-accent/25"
                                >
                                  {v.packages.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </select>
                              )}
                            </Cell>
                          ))}
                        </Row>

                        {/* Price */}
                        <Row label="Price">
                          {vendors.map((v) => {
                            const pkg = getPackage(v);
                            return (
                              <Cell key={v.id} className="font-semibold text-gray-900">
                                {fmt(pkg?.price)}
                              </Cell>
                            );
                          })}
                        </Row>

                        {/* Capacity */}
                        <Row label="Capacity">
                          {vendors.map((v) => {
                            const pkg = getPackage(v);
                            return (
                              <Cell key={v.id}>
                                {pkg?.capacity != null ? `${pkg.capacity} guests` : "—"}
                              </Cell>
                            );
                          })}
                        </Row>

                        {/* Inclusions */}
                        <Row label="Inclusions">
                          {vendors.map((v) => {
                            const pkg = getPackage(v);
                            return (
                              <Cell key={v.id}>
                                {pkg?.inclusions ? (
                                  <span className="whitespace-pre-wrap">{pkg.inclusions}</span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </Cell>
                            );
                          })}
                        </Row>

                        {/* Package notes */}
                        <Row label="Notes">
                          {vendors.map((v) => {
                            const pkg = getPackage(v);
                            return (
                              <Cell key={v.id}>
                                {pkg?.notes ?? <span className="text-gray-400">—</span>}
                              </Cell>
                            );
                          })}
                        </Row>

                        {/* Contact */}
                        <Row label="Contact">
                          {vendors.map((v) => (
                            <Cell key={v.id}>
                              <div className="space-y-0.5">
                                {v.contactName && <div>{v.contactName}</div>}
                                {v.email && <div className="text-gray-400 break-all">{v.email}</div>}
                                {v.phone && <div className="text-gray-400">{v.phone}</div>}
                                {!v.contactName && !v.email && !v.phone && (
                                  <span className="text-gray-400">—</span>
                                )}
                              </div>
                            </Cell>
                          ))}
                        </Row>

                        {/* Website */}
                        <Row label="Website">
                          {vendors.map((v) => (
                            <Cell key={v.id}>
                              {v.website ? (
                                <a
                                  href={v.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-accent hover:underline break-all"
                                >
                                  {v.website.replace(/^https?:\/\//, "")}
                                </a>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </Cell>
                          ))}
                        </Row>

                        {/* Vendor notes */}
                        <Row label="Our notes">
                          {vendors.map((v) => (
                            <Cell key={v.id}>
                              {v.notes ? (
                                <span className="whitespace-pre-wrap">{v.notes}</span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </Cell>
                          ))}
                        </Row>

                        {/* Book action */}
                        <Row label="">
                          {vendors.map((v) => (
                            <Cell key={v.id}>
                              {v.status === "booked" ? (
                                <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                  Booked
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleBook(v.id)}
                                  disabled={bookingId === v.id}
                                  className={cn(
                                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
                                    "bg-accent text-white hover:bg-accent-hover shadow-sm",
                                    bookingId === v.id && "opacity-60 cursor-not-allowed"
                                  )}
                                >
                                  {bookingId === v.id ? "Booking…" : "Book This Vendor"}
                                </button>
                              )}
                            </Cell>
                          ))}
                        </Row>
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
