"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import {
  addRegistryAction,
  updateRegistryAction,
  deleteRegistryAction,
} from "@/lib/actions/registry";
import type { Registry, RegistryType } from "@prisma/client";

// ── Store logo data ─────────────────────────────────────────────────────────

const STORE_DOMAINS: Record<string, string> = {
  "Amazon": "amazon.com",
  "Target": "target.com",
  "Zola": "zola.com",
  "Crate & Barrel": "crateandbarrel.com",
  "Williams Sonoma": "williams-sonoma.com",
  "Pottery Barn": "potterybarn.com",
  "Macy's": "macys.com",
  "The Knot": "theknot.com",
  "Honeyfund": "honeyfund.com",
  "Zola Cash Fund": "zola.com",
  "PayPal.me": "paypal.com",
  "Venmo": "venmo.com",
  "GoFundMe": "gofundme.com",
};

function getStoreLogo(store: string): string | null {
  const domain = STORE_DOMAINS[store];
  return domain
    ? `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`
    : null;
}

// ── Constants ──────────────────────────────────────────────────────────────

const REGISTRY_STORES = [
  "Amazon", "Target", "Zola", "Crate & Barrel",
  "Williams Sonoma", "Pottery Barn", "Macy's", "The Knot", "Custom",
];

const FUND_PLATFORMS = [
  "Honeyfund", "Zola Cash Fund", "PayPal.me", "Venmo", "GoFundMe", "Custom",
];

// ── Types ──────────────────────────────────────────────────────────────────

interface RegistryClientProps {
  registries: Registry[];
}

interface FormState {
  store: string;
  customStore: string;
  url: string;
  description: string;
  isPublic: boolean;
}

const emptyForm = (): FormState => ({
  store: "",
  customStore: "",
  url: "",
  description: "",
  isPublic: true,
});

// ── Icons ──────────────────────────────────────────────────────────────────

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function BotanicalMini({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 80 56" fill="none" className={className}>
      <line x1="40" y1="52" x2="40" y2="6" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M40 40 Q27 32 23 22" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      <path d="M40 28 Q29 20 27 12" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      <ellipse cx="21" cy="20" rx="5" ry="2" transform="rotate(-35 21 20)" stroke="currentColor" strokeWidth="0.7" fill="none" />
      <ellipse cx="25" cy="10" rx="4" ry="1.6" transform="rotate(-50 25 10)" stroke="currentColor" strokeWidth="0.7" fill="none" />
      <path d="M40 40 Q53 32 57 22" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      <path d="M40 28 Q51 20 53 12" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none" />
      <ellipse cx="59" cy="20" rx="5" ry="2" transform="rotate(35 59 20)" stroke="currentColor" strokeWidth="0.7" fill="none" />
      <ellipse cx="55" cy="10" rx="4" ry="1.6" transform="rotate(50 55 10)" stroke="currentColor" strokeWidth="0.7" fill="none" />
    </svg>
  );
}

// ── Store logo image with initials fallback ─────────────────────────────────

function StoreLogoImg({ store, size }: { store: string; size: number }) {
  const [failed, setFailed] = useState(false);
  const logo = getStoreLogo(store);
  const initials = store.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || store.slice(0, 2).toUpperCase();

  if (!logo || failed) {
    return (
      <span
        className="flex items-center justify-center text-amber-600 font-semibold select-none"
        style={{ fontSize: size * 0.35 }}
      >
        {initials}
      </span>
    );
  }

  return (
    <img
      src={logo}
      alt={store}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className="object-contain w-full h-full"
    />
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export default function RegistryClient({ registries }: RegistryClientProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<RegistryType>("REGISTRY");
  const [error, setError] = useState<string | null>(null);

  // Add form
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm());
  const [savingEditId, setSavingEditId] = useState<string | null>(null);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = registries.filter((r) => r.type === activeTab);
  const presets = activeTab === "REGISTRY" ? REGISTRY_STORES : FUND_PLATFORMS;

  // ── Helpers ────────────────────────────────────────────────────────────

  function resolvedStore(form: FormState): string {
    return form.store === "Custom" ? form.customStore.trim() : form.store;
  }

  function formToInput(form: FormState, type: RegistryType) {
    return {
      type,
      store: resolvedStore(form),
      url: form.url.trim(),
      description: form.description.trim() || undefined,
      isPublic: form.isPublic,
    };
  }

  function startEdit(entry: Registry) {
    const isCustom = !presets.slice(0, -1).includes(entry.store);
    setEditingId(entry.id);
    setEditForm({
      store: isCustom ? "Custom" : entry.store,
      customStore: isCustom ? entry.store : "",
      url: entry.url,
      description: entry.description ?? "",
      isPublic: entry.isPublic,
    });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(emptyForm());
  }

  function cancelAdd() {
    setAdding(false);
    setAddForm(emptyForm());
    setError(null);
  }

  // ── Handlers ───────────────────────────────────────────────────────────

  async function handleAdd() {
    const store = resolvedStore(addForm);
    if (!store) { setError("Store name is required."); return; }
    if (!addForm.url.trim()) { setError("URL is required."); return; }
    setSaving(true);
    setError(null);
    try {
      await addRegistryAction(formToInput(addForm, activeTab));
      setAdding(false);
      setAddForm(emptyForm());
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add entry.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit(id: string) {
    const store = resolvedStore(editForm);
    if (!store) { setError("Store name is required."); return; }
    if (!editForm.url.trim()) { setError("URL is required."); return; }
    setSavingEditId(id);
    setError(null);
    try {
      await updateRegistryAction(id, formToInput(editForm, activeTab));
      cancelEdit();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update entry.");
    } finally {
      setSavingEditId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      await deleteRegistryAction(id);
      setConfirmDeleteId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete entry.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleTogglePublic(entry: Registry) {
    try {
      await updateRegistryAction(entry.id, {
        type: entry.type,
        store: entry.store,
        url: entry.url,
        description: entry.description ?? undefined,
        isPublic: !entry.isPublic,
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update.");
    }
  }

  // ── Form sub-components ────────────────────────────────────────────────

  const fieldCls = "w-full text-sm border border-amber-200 rounded-lg px-3 py-2 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15 bg-white transition-colors placeholder:text-gray-300";
  const labelCls = "block text-xs font-medium text-gray-500 mb-1.5 tracking-wide";

  // Visual store picker — elegant pill chips, no external image dependency
  function StorePicker({ form, onChange }: { form: FormState; onChange: (patch: Partial<FormState>) => void }) {
    const label = activeTab === "REGISTRY" ? "Store" : "Platform";

    return (
      <div>
        <label className={labelCls}>{label}</label>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => {
            const isSelected = form.store === preset;
            const isCustom = preset === "Custom";

            return (
              <button
                key={preset}
                type="button"
                onClick={() => onChange({ store: preset, customStore: "" })}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 whitespace-nowrap",
                  isSelected
                    ? "border-amber-400 bg-amber-50 text-amber-700 shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-amber-200 hover:bg-amber-50/40 hover:text-amber-700"
                )}
              >
                {isCustom && (
                  <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                )}
                {preset}
                {isSelected && (
                  <svg className="w-3 h-3 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom name input — slides in when "Custom" is selected */}
        <AnimatePresence>
          {form.store === "Custom" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <input
                autoFocus
                value={form.customStore}
                onChange={(e) => onChange({ customStore: e.target.value })}
                placeholder="Store or platform name"
                className={cn(fieldCls, "mt-2.5")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  function UrlInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
      <div>
        <label className={labelCls}>URL</label>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className={fieldCls}
        />
      </div>
    );
  }

  function DescriptionInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
      <div>
        <label className={labelCls}>
          Description <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={activeTab === "FUND" ? "e.g. Honeymoon in Italy" : ""}
          maxLength={200}
          className={fieldCls}
        />
      </div>
    );
  }

  function PublicToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={value}
          onClick={() => onChange(!value)}
          className={cn(
            "relative w-9 h-5 rounded-full transition-colors",
            value ? "bg-amber-500" : "bg-gray-200"
          )}
        >
          <span className={cn(
            "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
            value && "translate-x-4"
          )} />
        </button>
        <span className="text-xs text-gray-500">{value ? "Visible to guests" : "Hidden from guests"}</span>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl">
      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between gap-3 mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="shrink-0 text-red-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Tabs + Add button ────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        {/* Editorial sliding-indicator tabs */}
        <div className="flex items-center gap-7 border-b border-gray-100 pb-0">
          {(["REGISTRY", "FUND"] as RegistryType[]).map((tab) => {
            const count = registries.filter((r) => r.type === tab).length;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); cancelAdd(); cancelEdit(); setError(null); }}
                className="relative pb-3 flex items-center gap-2 group"
              >
                {tab === "REGISTRY"
                  ? <GiftIcon className={cn("w-4 h-4 transition-colors", isActive ? "text-gray-700" : "text-gray-400 group-hover:text-gray-500")} />
                  : <HeartIcon className={cn("w-4 h-4 transition-colors", isActive ? "text-gray-700" : "text-gray-400 group-hover:text-gray-500")} />
                }
                <span className={cn(
                  "text-sm font-medium transition-colors duration-150",
                  isActive ? "text-gray-900" : "text-gray-400 group-hover:text-gray-600"
                )}>
                  {tab === "REGISTRY" ? "Gift Registries" : "Funds"}
                </span>
                {count > 0 && (
                  <span className={cn(
                    "text-[11px] font-semibold rounded-full px-1.5 py-0.5 min-w-[18px] text-center transition-colors",
                    isActive ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
                  )}>
                    {count}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="registry-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => { cancelEdit(); setAdding(true); }}
          disabled={adding}
        >
          {activeTab === "REGISTRY" ? "+ Add Registry" : "+ Add Fund"}
        </Button>
      </div>

      {/* ── Add form — animated ──────────────────────────────────────── */}
      <AnimatePresence>
        {adding && (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="mb-5 bg-white rounded-2xl border border-amber-100 shadow-apple-md overflow-hidden"
          >
            <div className="px-5 pt-4 pb-3 border-b border-amber-100/80">
              <p className="font-serif text-[16px] font-medium text-gray-800">
                {activeTab === "REGISTRY" ? "Add Gift Registry" : "Add Fund"}
              </p>
            </div>
            <div className="p-5 space-y-4">
              <StorePicker form={addForm} onChange={(p) => setAddForm((f) => ({ ...f, ...p }))} />
              <UrlInput value={addForm.url} onChange={(v) => setAddForm((f) => ({ ...f, url: v }))} />
              {activeTab === "FUND" && (
                <DescriptionInput
                  value={addForm.description}
                  onChange={(v) => setAddForm((f) => ({ ...f, description: v }))}
                />
              )}
              <div className="flex items-center justify-between pt-1">
                <PublicToggle value={addForm.isPublic} onChange={(v) => setAddForm((f) => ({ ...f, isPublic: v }))} />
                <div className="flex gap-2">
                  <Button size="sm" variant="primary" loading={saving} onClick={handleAdd}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={cancelAdd}>Cancel</Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── List ────────────────────────────────────────────────────── */}
      {filtered.length === 0 && !adding ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-amber-100 text-center">
          <BotanicalMini className={cn(
            "w-14 mb-4",
            activeTab === "REGISTRY" ? "text-amber-300" : "text-rose-300"
          )} />
          <h3 className="font-serif text-xl font-light text-gray-600 mb-1">
            {activeTab === "REGISTRY" ? "No registries yet" : "No funds yet"}
          </h3>
          <p className="text-sm italic text-gray-400 max-w-xs leading-relaxed mb-6">
            {activeTab === "REGISTRY"
              ? "Add links to Amazon, Zola, Target, and more."
              : "Add links to Honeyfund, PayPal.me, GoFundMe, and more."}
          </p>
          <Button size="sm" variant="primary" onClick={() => setAdding(true)}>
            {activeTab === "REGISTRY" ? "Add Registry" : "Add Fund"}
          </Button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {filtered.map((entry) => {
              const isEditing = editingId === entry.id;
              const isConfirmingDelete = confirmDeleteId === entry.id;

              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="group relative bg-white rounded-xl border border-gray-100/80 shadow-apple-sm hover:shadow-apple-md transition-all overflow-hidden"
                >
                  {/* Gold left accent bar — fades in on hover */}
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-l-xl" />

                  {isEditing ? (
                    <div className="p-4 pl-5 space-y-4">
                      <StorePicker form={editForm} onChange={(p) => setEditForm((f) => ({ ...f, ...p }))} />
                      <UrlInput value={editForm.url} onChange={(v) => setEditForm((f) => ({ ...f, url: v }))} />
                      {activeTab === "FUND" && (
                        <DescriptionInput
                          value={editForm.description}
                          onChange={(v) => setEditForm((f) => ({ ...f, description: v }))}
                        />
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <PublicToggle value={editForm.isPublic} onChange={(v) => setEditForm((f) => ({ ...f, isPublic: v }))} />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            loading={savingEditId === entry.id}
                            onClick={() => handleSaveEdit(entry.id)}
                          >
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="relative flex items-center gap-3 pl-5 pr-4 py-3.5">
                        {/* Store logo circle */}
                        <div className="shrink-0 w-10 h-10 rounded-full bg-gray-50 border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden transition-all duration-200 group-hover:border-amber-200 group-hover:shadow-amber-50/80">
                          <StoreLogoImg store={entry.store} size={40} />
                        </div>

                        {/* Store info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-serif text-[17px] font-medium text-gray-900 mb-0.5 leading-snug">
                            {entry.store}
                          </p>
                          {entry.description && (
                            <p className="text-sm text-gray-400 italic mb-1">{entry.description}</p>
                          )}
                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] tracking-[0.12em] uppercase text-gray-400 hover:text-gray-700 transition-colors font-sans"
                          >
                            Visit
                            <ExternalLinkIcon className="w-3 h-3" />
                          </a>
                        </div>

                        {/* Public/Hidden badge — amber for public */}
                        <button
                          onClick={() => handleTogglePublic(entry)}
                          title={entry.isPublic ? "Visible to guests — click to hide" : "Hidden — click to show"}
                          className={cn(
                            "shrink-0 flex items-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-1.5 border transition-colors",
                            entry.isPublic
                              ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                              : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                          )}
                        >
                          {entry.isPublic
                            ? <CheckCircleIcon className="w-3.5 h-3.5" />
                            : <LockIcon className="w-3.5 h-3.5" />
                          }
                          {entry.isPublic ? "Public" : "Hidden"}
                        </button>

                        {/* Hover edit/delete actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                          <button
                            onClick={() => startEdit(entry)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(isConfirmingDelete ? null : entry.id)}
                            disabled={deletingId === entry.id}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                            title="Delete"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Inline delete confirmation */}
                      <AnimatePresence>
                        {isConfirmingDelete && (
                          <motion.div
                            key="confirm"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.18 }}
                            className="overflow-hidden"
                          >
                            <div className="flex items-center justify-between gap-3 px-5 py-3 bg-red-50 border-t border-red-100">
                              <p className="text-xs text-red-600 font-medium">Delete &ldquo;{entry.store}&rdquo;?</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDelete(entry.id)}
                                  disabled={deletingId === entry.id}
                                  className="text-xs bg-red-500 text-white rounded-lg px-3 py-1.5 hover:bg-red-600 transition-colors disabled:opacity-60"
                                >
                                  {deletingId === entry.id ? "Deleting…" : "Delete"}
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
