"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import {
  CEREMONY_ITEM_LABELS,
  CEREMONY_ITEM_COLORS,
  CEREMONY_ITEM_ICONS,
  type CeremonyItemType,
} from "@/lib/ceremony-constants";
import {
  deleteCeremonyItemAction,
  reorderCeremonyItemsAction,
  seedDefaultCeremonyAction,
  updateVowsAction,
  updateMusicAction,
} from "@/lib/actions/ceremony";
import AddCeremonyItemDialog, {
  type CeremonyItemRow,
} from "@/components/dashboard/AddCeremonyItemDialog";
import Button from "@/components/ui/Button";

// ── Types ──────────────────────────────────────────────────────────────────

export type CeremonyProgramRow = {
  id:              string;
  partner1Vows:    string | null;
  partner2Vows:    string | null;
  processionalSong: string | null;
  recessionalSong:  string | null;
};

interface CeremonyClientProps {
  program:      CeremonyProgramRow | null;
  initialItems: CeremonyItemRow[];
  partner1Name: string;
  partner2Name: string;
}

// ── Vow Card ───────────────────────────────────────────────────────────────

function VowCard({
  label,
  value,
  onSave,
}: {
  label:  string;
  value:  string | null;
  onSave: (text: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [text,    setText]    = useState(value ?? "");
  const [saving,  setSaving]  = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(text);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-700">{label}</p>
        {!editing && (
          <button
            type="button"
            onClick={() => { setText(value ?? ""); setEditing(true); }}
            className="text-[11px] text-accent hover:underline"
          >
            {value ? "Edit" : "Write vows"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder={`Write ${label}'s vows here…`}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none transition"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="text-xs font-medium text-accent hover:underline disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : value ? (
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-4">
          {value}
        </p>
      ) : (
        <p className="text-sm text-gray-400 italic">No vows written yet.</p>
      )}
    </div>
  );
}

// ── Music Card ─────────────────────────────────────────────────────────────

function MusicCard({
  processionalSong,
  recessionalSong,
}: {
  processionalSong: string | null;
  recessionalSong:  string | null;
}) {
  const [proc,    setProc]    = useState(processionalSong ?? "");
  const [rec,     setRec]     = useState(recessionalSong  ?? "");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const router = useRouter();

  async function handleSave() {
    setSaving(true);
    try {
      await updateMusicAction({ processionalSong: proc || null, recessionalSong: rec || null });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch {
      alert("Failed to save music.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[11px] font-medium text-gray-500 mb-1">Processional song</label>
        <input
          type="text"
          value={proc}
          onChange={(e) => { setProc(e.target.value); setSaved(false); }}
          placeholder="e.g. Canon in D"
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
        />
      </div>
      <div>
        <label className="block text-[11px] font-medium text-gray-500 mb-1">Recessional song</label>
        <input
          type="text"
          value={rec}
          onChange={(e) => { setRec(e.target.value); setSaved(false); }}
          placeholder="e.g. Ode to Joy"
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
        />
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2 rounded-lg bg-gray-100 text-xs font-medium text-gray-700 hover:bg-gray-200 transition disabled:opacity-50"
      >
        {saving ? "Saving…" : saved ? "✓ Saved" : "Save music"}
      </button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function CeremonyClient({
  program,
  initialItems,
  partner1Name,
  partner2Name,
}: CeremonyClientProps) {
  const router = useRouter();

  const [items,       setItems]       = useState<CeremonyItemRow[]>(initialItems);
  const [dialogOpen,  setDialogOpen]  = useState(false);
  const [editingItem, setEditingItem] = useState<CeremonyItemRow | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);

  // ── Computed stats ─────────────────────────────────────────────────────

  const readingCount  = items.filter((i) => i.type === "reading").length;
  const hasVow1       = !!program?.partner1Vows;
  const hasVow2       = !!program?.partner2Vows;
  const vowsStatus    = hasVow1 && hasVow2 ? "Both written" : hasVow1 || hasVow2 ? "1 of 2 written" : "Not started";
  const hasSong       = !!(program?.processionalSong || program?.recessionalSong);

  // ── Handlers ───────────────────────────────────────────────────────────

  async function handleSeedTemplate() {
    setSeedLoading(true);
    try {
      const seeded = await seedDefaultCeremonyAction();
      setItems(seeded.map((item) => ({
        id:          item.id,
        programId:   item.programId,
        type:        item.type,
        title:       item.title,
        description: item.description,
        assignedTo:  item.assignedTo,
        notes:       item.notes,
        order:       item.order,
      })));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to load template.");
    } finally {
      setSeedLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this item from the program?")) return;
    setDeletingId(id);
    try {
      await deleteCeremonyItemAction(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      alert("Failed to delete item.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleItemSaved(saved: CeremonyItemRow) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
  }

  function handleOpenAdd() {
    setEditingItem(null);
    setDialogOpen(true);
  }

  function handleOpenEdit(item: CeremonyItemRow) {
    setEditingItem(item);
    setDialogOpen(true);
  }

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const srcIdx  = result.source.index;
    const dstIdx  = result.destination.index;
    if (srcIdx === dstIdx) return;

    const reordered = Array.from(items);
    const [moved]   = reordered.splice(srcIdx, 1);
    reordered.splice(dstIdx, 0, moved);

    setItems(reordered);

    try {
      await reorderCeremonyItemsAction(reordered.map((i) => i.id));
    } catch {
      // Revert on failure
      setItems(items);
      alert("Failed to save order.");
    }
  }

  async function handleSaveVows(field: "partner1Vows" | "partner2Vows", text: string) {
    await updateVowsAction({ [field]: text || null });
    router.refresh();
  }

  // ── Empty state ────────────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center bg-white rounded-xl shadow-apple-sm px-8 py-20 text-center">
          <div className="text-6xl mb-6">💒</div>
          <h2 className="font-serif text-2xl text-gray-800 mb-2">
            Plan your ceremony
          </h2>
          <p className="text-sm text-gray-400 max-w-xs mb-8">
            Build your order of service, write your vows, and select your processional music.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={handleSeedTemplate}
              loading={seedLoading}
            >
              ✨ Load default program
            </Button>
            <Button variant="primary" size="md" onClick={handleOpenAdd}>
              + Add first item
            </Button>
          </div>
        </div>

        <AddCeremonyItemDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          editingItem={editingItem}
          onSuccess={handleItemSaved}
        />
      </>
    );
  }

  // ── Full view ──────────────────────────────────────────────────────────

  return (
    <>
      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Program items",  value: String(items.length) },
          { label: "Readings",       value: readingCount > 0 ? String(readingCount) : "None" },
          { label: "Vows",           value: vowsStatus },
          { label: "Music",          value: hasSong ? "Selected" : "Not set" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg shadow-apple-sm p-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{s.label}</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Main two-column layout */}
      <div className="flex gap-6 items-start">

        {/* ── Left: Ceremony Program ───────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">
              Order of Service
            </h2>
            <Button variant="primary" size="sm" onClick={handleOpenAdd}>
              + Add item
            </Button>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="ceremony-program">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-2"
                >
                  {items.map((item, index) => {
                    const color      = CEREMONY_ITEM_COLORS[item.type as CeremonyItemType] ?? "#6b7280";
                    const icon       = CEREMONY_ITEM_ICONS[item.type as CeremonyItemType]  ?? "✨";
                    const label      = CEREMONY_ITEM_LABELS[item.type as CeremonyItemType] ?? item.type;
                    const isDeleting = deletingId === item.id;

                    return (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(drag, snapshot) => (
                          <div
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                          >
                            <div
                              className={cn(
                                "bg-white rounded-lg shadow-apple-sm overflow-hidden group flex items-stretch transition-opacity",
                                snapshot.isDragging && "shadow-apple-lg ring-1 ring-gray-200 rotate-[0.5deg]",
                                isDeleting && "opacity-40 pointer-events-none"
                              )}
                              style={{ borderLeft: `4px solid ${color}` }}
                            >
                              {/* Drag handle */}
                              <div
                                {...drag.dragHandleProps}
                                className="flex items-center px-2 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0"
                                title="Drag to reorder"
                              >
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                  <circle cx="9"  cy="5"  r="1.5" />
                                  <circle cx="15" cy="5"  r="1.5" />
                                  <circle cx="9"  cy="12" r="1.5" />
                                  <circle cx="15" cy="12" r="1.5" />
                                  <circle cx="9"  cy="19" r="1.5" />
                                  <circle cx="15" cy="19" r="1.5" />
                                </svg>
                              </div>

                              {/* Step number */}
                              <div className="flex items-center justify-center w-8 shrink-0 text-[11px] font-semibold text-gray-300">
                                {index + 1}
                              </div>

                              {/* Content */}
                              <div className="flex-1 py-3 pr-3 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    {/* Type chip */}
                                    <span
                                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full mb-1.5"
                                      style={{ backgroundColor: `${color}18`, color }}
                                    >
                                      {icon} {label}
                                    </span>

                                    {/* Title */}
                                    <p className="text-[14px] font-semibold text-gray-900 leading-snug">
                                      {item.title}
                                    </p>

                                    {/* Description */}
                                    {item.description && (
                                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                        {item.description}
                                      </p>
                                    )}

                                    {/* Assigned to */}
                                    {item.assignedTo && (
                                      <p className="text-xs text-gray-400 mt-1">
                                        👤 {item.assignedTo}
                                      </p>
                                    )}
                                  </div>

                                  {/* Edit / Delete */}
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit(item)}
                                      className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                      title="Edit"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(item.id)}
                                      className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                      title="Delete"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Add item button at bottom */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-accent hover:text-accent transition-colors"
            >
              + Add program item
            </button>
          </div>
        </div>

        {/* ── Right: Vows + Music ──────────────────────────────────────── */}
        <div className="w-80 shrink-0 space-y-4">

          {/* Vows card */}
          <div className="bg-white rounded-xl shadow-apple-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">💍</span>
              <h2 className="text-[13px] font-semibold text-gray-900">Vows</h2>
              <span className="text-[10px] text-gray-400 ml-auto">Private</span>
            </div>

            <div className="divide-y divide-gray-100 space-y-3">
              <VowCard
                label={partner1Name}
                value={program?.partner1Vows ?? null}
                onSave={(text) => handleSaveVows("partner1Vows", text)}
              />
              <VowCard
                label={partner2Name}
                value={program?.partner2Vows ?? null}
                onSave={(text) => handleSaveVows("partner2Vows", text)}
              />
            </div>
          </div>

          {/* Music card */}
          <div className="bg-white rounded-xl shadow-apple-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🎵</span>
              <h2 className="text-[13px] font-semibold text-gray-900">Music</h2>
            </div>
            <MusicCard
              processionalSong={program?.processionalSong ?? null}
              recessionalSong={program?.recessionalSong   ?? null}
            />
          </div>

        </div>
      </div>

      {/* Dialog */}
      <AddCeremonyItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingItem={editingItem}
        onSuccess={handleItemSaved}
      />
    </>
  );
}
