"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  addRegistryAction,
  updateRegistryAction,
  deleteRegistryAction,
} from "@/lib/actions/registry";
import type { Registry, RegistryType } from "@prisma/client";

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
    if (!confirm("Delete this entry?")) return;
    setDeletingId(id);
    setError(null);
    try {
      await deleteRegistryAction(id);
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

  // ── Render helpers ─────────────────────────────────────────────────────

  function StoreSelect({
    form,
    onChange,
  }: {
    form: FormState;
    onChange: (patch: Partial<FormState>) => void;
  }) {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-500">
          {activeTab === "REGISTRY" ? "Store" : "Platform"}
        </label>
        <select
          value={form.store}
          onChange={(e) => onChange({ store: e.target.value, customStore: "" })}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-accent"
        >
          <option value="">Select…</option>
          {presets.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        {form.store === "Custom" && (
          <input
            autoFocus
            value={form.customStore}
            onChange={(e) => onChange({ customStore: e.target.value })}
            placeholder="Store or platform name"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent"
          />
        )}
      </div>
    );
  }

  function UrlInput({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-500">URL</label>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent"
        />
      </div>
    );
  }

  function DescriptionInput({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-500">
          Description <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={activeTab === "FUND" ? "e.g. Honeymoon in Italy" : ""}
          maxLength={200}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-accent"
        />
      </div>
    );
  }

  function PublicToggle({
    value,
    onChange,
  }: {
    value: boolean;
    onChange: (v: boolean) => void;
  }) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={value}
          onClick={() => onChange(!value)}
          className={cn(
            "relative w-9 h-5 rounded-full transition-colors",
            value ? "bg-accent" : "bg-gray-200"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
              value && "translate-x-4"
            )}
          />
        </button>
        <span className="text-xs text-gray-500">
          {value ? "Visible to guests" : "Hidden from guests"}
        </span>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl">
      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between gap-3 mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="shrink-0 text-red-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Tabs + Add button */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
          {(["REGISTRY", "FUND"] as RegistryType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); cancelAdd(); cancelEdit(); setError(null); }}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {tab === "REGISTRY" ? "Gift Registries" : "Funds & Donations"}
            </button>
          ))}
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

      {/* Add form */}
      {adding && (
        <div className="mb-4 bg-white rounded-lg border border-gray-200 shadow-apple-sm p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">
            {activeTab === "REGISTRY" ? "New Registry" : "New Fund"}
          </p>
          <StoreSelect form={addForm} onChange={(p) => setAddForm((f) => ({ ...f, ...p }))} />
          <UrlInput value={addForm.url} onChange={(v) => setAddForm((f) => ({ ...f, url: v }))} />
          {activeTab === "FUND" && (
            <DescriptionInput
              value={addForm.description}
              onChange={(v) => setAddForm((f) => ({ ...f, description: v }))}
            />
          )}
          <PublicToggle
            value={addForm.isPublic}
            onChange={(v) => setAddForm((f) => ({ ...f, isPublic: v }))}
          />
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="primary" loading={saving} onClick={handleAdd}>Save</Button>
            <Button size="sm" variant="ghost" onClick={cancelAdd}>Cancel</Button>
          </div>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 && !adding ? (
        <div className="flex flex-col items-center justify-center py-14 text-center bg-white rounded-lg border border-dashed border-gray-200">
          <p className="text-sm font-medium text-gray-500 mb-1">
            {activeTab === "REGISTRY" ? "No registries added yet" : "No funds added yet"}
          </p>
          <p className="text-xs text-gray-400">
            {activeTab === "REGISTRY"
              ? "Add links to Amazon, Zola, Target, and more"
              : "Add links to Honeyfund, PayPal.me, GoFundMe, and more"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => {
            const isEditing = editingId === entry.id;
            return (
              <div
                key={entry.id}
                className="bg-white rounded-lg border border-gray-100 shadow-apple-sm overflow-hidden"
              >
                {isEditing ? (
                  <div className="p-4 space-y-3">
                    <StoreSelect form={editForm} onChange={(p) => setEditForm((f) => ({ ...f, ...p }))} />
                    <UrlInput value={editForm.url} onChange={(v) => setEditForm((f) => ({ ...f, url: v }))} />
                    {activeTab === "FUND" && (
                      <DescriptionInput
                        value={editForm.description}
                        onChange={(v) => setEditForm((f) => ({ ...f, description: v }))}
                      />
                    )}
                    <PublicToggle
                      value={editForm.isPublic}
                      onChange={(v) => setEditForm((f) => ({ ...f, isPublic: v }))}
                    />
                    <div className="flex gap-2 pt-1">
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
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{entry.store}</p>
                      {entry.description && (
                        <p className="text-xs text-gray-400 truncate">{entry.description}</p>
                      )}
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent hover:underline truncate block max-w-xs"
                      >
                        {entry.url}
                      </a>
                    </div>

                    {/* Public badge (clickable toggle) */}
                    <button
                      onClick={() => handleTogglePublic(entry)}
                      className="shrink-0"
                      title={entry.isPublic ? "Click to hide from guests" : "Click to show to guests"}
                    >
                      <Badge variant={entry.isPublic ? "success" : "default"}>
                        {entry.isPublic ? "Public" : "Hidden"}
                      </Badge>
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => startEdit(entry)}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>

                    {/* Delete */}
                    <button
                      disabled={deletingId === entry.id}
                      onClick={() => handleDelete(entry.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
