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
  venue:          "Venue",
  photographer:   "Photographer",
  caterer:        "Caterer",
  florist:        "Florist",
  dj:             "DJ",
  officiant:      "Officiant",
  hairMakeup:     "Hair & Makeup",
  transportation: "Transportation",
  cake:           "Cake",
  stationery:     "Stationery",
  other:          "Other",
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

function renderInclusions(text: string | null | undefined): React.ReactNode {
  if (!text) return <span className="text-gray-300">—</span>;
  const items = text.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
  if (items.length <= 1) return <span className="text-[13px] text-gray-700">{text}</span>;
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-1.5 text-[13px] text-gray-700">
          <span className="mt-[5px] w-1 h-1 rounded-full bg-gray-300 shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  );
}

const STATUS_TOP_COLOR: Record<string, string> = {
  booked:      "bg-emerald-400",
  shortlisted: "bg-amber-400",
  rejected:    "bg-red-400",
  prospect:    "bg-gray-300",
};

const STATUS_BADGE: Record<string, string> = {
  booked:      "bg-emerald-50 text-emerald-700",
  shortlisted: "bg-amber-50 text-amber-700",
  rejected:    "bg-red-50 text-red-600",
  prospect:    "bg-gray-100 text-gray-600",
};

// ── Row: label cell + one cell per vendor, all in the same flex row ─────────

function CompareRow({
  label,
  odd,
  labelClassName,
  children,
}: {
  label: string;
  odd: boolean;
  labelClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex border-b border-gray-50", odd ? "bg-gray-50/60" : "bg-white")}>
      {/* Fixed label cell */}
      <div className="w-36 shrink-0 border-r border-gray-100 px-4 py-4 flex items-start">
        <span className={cn("text-[10px] font-semibold tracking-[0.12em] uppercase text-gray-400 leading-tight", labelClassName)}>
          {label}
        </span>
      </div>
      {/* Vendor cells — flex-1 distributes evenly */}
      <div className="flex flex-1 divide-x divide-gray-100">
        {children}
      </div>
    </div>
  );
}

function VCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex-1 min-w-[180px] px-4 py-4", className)}>
      {children}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export default function VendorComparisonTable({ open, onOpenChange, vendors, onBook }: VendorComparisonTableProps) {
  const [selectedPkgIds, setSelectedPkgIds] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    vendors.forEach((v) => {
      if (v.packages.length > 0) map[v.id] = v.packages[0].id;
    });
    return map;
  });
  const [bookingId, setBookingId] = useState<string | null>(null);

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

  // Best value: lowest price among vendors that have a price
  const prices = vendors.map((v) => getPackage(v)?.price ?? null);
  const validPrices = prices.filter((p): p is number => p != null);
  const lowestPrice = validPrices.length > 1 ? Math.min(...validPrices) : null;

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

            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 8 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed inset-0 flex items-center justify-center z-50 p-4"
              >
                <div className="bg-white rounded-xl shadow-apple-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

                  {/* Accent bar */}
                  <div className="h-[3px] bg-gradient-to-r from-accent to-accent-dark shrink-0 rounded-t-xl" />

                  {/* Header */}
                  <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <div>
                      <Dialog.Title className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">
                        Compare {CATEGORY_LABEL[category] ?? "Vendors"}
                      </Dialog.Title>
                      <p className="font-serif text-[18px] text-gray-800 mt-0.5">
                        {vendors.length} vendors side by side
                      </p>
                    </div>
                    <Dialog.Close className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors mt-0.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Dialog.Close>
                  </div>

                  {/* Scrollable body */}
                  <div className="flex-1 overflow-auto min-h-0">

                    {/* Vendor header row */}
                    <div className="flex border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
                      {/* Label corner */}
                      <div className="w-36 shrink-0 border-r border-gray-100 px-4 py-4 flex items-end">
                        <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-gray-400">Vendor</span>
                      </div>
                      {/* One header cell per vendor */}
                      <div className="flex flex-1 divide-x divide-gray-100">
                        {vendors.map((v) => (
                          <div key={v.id} className="flex-1 min-w-[180px] flex flex-col">
                            {/* Status stripe */}
                            <div className={cn("h-1 w-full", STATUS_TOP_COLOR[v.status] ?? "bg-gray-200")} />
                            <div className="px-4 py-3 flex flex-col gap-1.5">
                              <span className="font-serif text-[18px] text-gray-900 leading-tight">
                                {v.name}
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] text-gray-500 bg-gray-200/80 rounded-full px-2 py-0.5">
                                  {CATEGORY_LABEL[v.category] ?? v.category}
                                </span>
                                <span className={cn("text-[10px] rounded-full px-2 py-0.5", STATUS_BADGE[v.status] ?? "bg-gray-100 text-gray-600")}>
                                  {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Package row */}
                    <CompareRow label="Package" odd={false}>
                      {vendors.map((v) => (
                        <VCell key={v.id}>
                          {v.packages.length === 0 ? (
                            <span className="text-gray-300 text-[13px] italic">No packages</span>
                          ) : v.packages.length === 1 ? (
                            <span className="text-[13px] text-gray-700">{v.packages[0].name}</span>
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
                        </VCell>
                      ))}
                    </CompareRow>

                    {/* Price row */}
                    <CompareRow label="Price" odd>
                      {vendors.map((v) => {
                        const pkg = getPackage(v);
                        const isBestValue = lowestPrice != null && pkg?.price === lowestPrice;
                        return (
                          <VCell key={v.id}>
                            {pkg?.price != null ? (
                              <div className="flex flex-col gap-1">
                                <span className="font-serif text-[28px] font-medium text-gray-900 leading-none">
                                  {fmt(pkg.price)}
                                </span>
                                {isBestValue && (
                                  <span className="self-start mt-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                                    Best value
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="font-serif text-[24px] text-gray-200">—</span>
                            )}
                          </VCell>
                        );
                      })}
                    </CompareRow>

                    {/* Capacity row */}
                    <CompareRow label="Capacity" odd={false}>
                      {vendors.map((v) => {
                        const pkg = getPackage(v);
                        return (
                          <VCell key={v.id}>
                            <span className="text-[13px] text-gray-700">
                              {pkg?.capacity != null ? `${pkg.capacity} guests` : <span className="text-gray-300">—</span>}
                            </span>
                          </VCell>
                        );
                      })}
                    </CompareRow>

                    {/* Inclusions row */}
                    <CompareRow label="Inclusions" odd>
                      {vendors.map((v) => {
                        const pkg = getPackage(v);
                        return <VCell key={v.id}>{renderInclusions(pkg?.inclusions)}</VCell>;
                      })}
                    </CompareRow>

                    {/* Notes row */}
                    <CompareRow label="Notes" odd={false}>
                      {vendors.map((v) => {
                        const pkg = getPackage(v);
                        return (
                          <VCell key={v.id}>
                            {pkg?.notes ? (
                              <span className="text-[13px] text-gray-700 whitespace-pre-wrap">{pkg.notes}</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </VCell>
                        );
                      })}
                    </CompareRow>

                    {/* Contact row */}
                    <CompareRow label="Contact" odd>
                      {vendors.map((v) => (
                        <VCell key={v.id}>
                          <div className="space-y-0.5">
                            {v.contactName && <div className="text-[13px] text-gray-700">{v.contactName}</div>}
                            {v.email && <div className="text-[12px] text-gray-400 break-all">{v.email}</div>}
                            {v.phone && <div className="text-[12px] text-gray-400">{v.phone}</div>}
                            {!v.contactName && !v.email && !v.phone && <span className="text-gray-300">—</span>}
                          </div>
                        </VCell>
                      ))}
                    </CompareRow>

                    {/* Website row */}
                    <CompareRow label="Website" odd={false}>
                      {vendors.map((v) => (
                        <VCell key={v.id}>
                          {v.website ? (
                            <a
                              href={v.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[13px] text-accent hover:underline break-all"
                            >
                              {v.website.replace(/^https?:\/\//, "")}
                            </a>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </VCell>
                      ))}
                    </CompareRow>

                    {/* Our notes row */}
                    <CompareRow label="Our notes" odd>
                      {vendors.map((v) => (
                        <VCell key={v.id}>
                          {v.notes ? (
                            <span className="text-[13px] text-gray-700 whitespace-pre-wrap">{v.notes}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </VCell>
                      ))}
                    </CompareRow>

                    {/* Book CTA row */}
                    <CompareRow label="" odd={false}>
                      {vendors.map((v) => (
                        <VCell key={v.id} className="py-3">
                          {v.status === "booked" ? (
                            <div className="w-full py-2.5 rounded-md bg-emerald-50 flex items-center justify-center gap-1.5 text-emerald-700 text-[13px] font-semibold">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              Booked
                            </div>
                          ) : (
                            <button
                              onClick={() => handleBook(v.id)}
                              disabled={bookingId === v.id}
                              className={cn(
                                "w-full py-2.5 rounded-md text-[13px] font-semibold transition-all duration-150",
                                "bg-accent text-white hover:bg-accent-hover shadow-apple-xs",
                                bookingId === v.id && "opacity-60 cursor-not-allowed"
                              )}
                            >
                              {bookingId === v.id ? "Booking…" : "Book This Vendor"}
                            </button>
                          )}
                        </VCell>
                      ))}
                    </CompareRow>
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
