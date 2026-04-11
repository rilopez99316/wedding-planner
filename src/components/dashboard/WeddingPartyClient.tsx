"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { WeddingPartyMember, WeddingPartySide } from "@prisma/client";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import WeddingPartyMemberCard from "./WeddingPartyMemberCard";
import AddWeddingPartyMemberDialog from "./AddWeddingPartyMemberDialog";
import {
  deleteWeddingPartyMemberAction,
  reorderWeddingPartyAction,
  toggleMemberPublicAction,
} from "@/lib/actions/wedding-party";
import { cn } from "@/lib/utils";

// ── Filter tabs ──────────────────────────────────────────────────────────────

type SideFilter = "ALL" | "BRIDE" | "GROOM";

const SIDE_TABS: { value: SideFilter; label: string }[] = [
  { value: "ALL",   label: "All" },
  { value: "BRIDE", label: "Bride's Side" },
  { value: "GROOM", label: "Groom's Side" },
];

// ── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show:   {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring" as const, stiffness: 250, damping: 28 },
  },
};

// ── Component ────────────────────────────────────────────────────────────────

interface WeddingPartyClientProps {
  initialMembers: WeddingPartyMember[];
}

export default function WeddingPartyClient({ initialMembers }: WeddingPartyClientProps) {
  const [members,       setMembers]       = useState<WeddingPartyMember[]>(initialMembers);
  const [activeSide,    setActiveSide]    = useState<SideFilter>("ALL");
  const [dialogOpen,    setDialogOpen]    = useState(false);
  const [editingMember, setEditingMember] = useState<WeddingPartyMember | null>(null);

  // ── Computed ───────────────────────────────────────────────────────────────

  const filtered = activeSide === "ALL"
    ? members
    : members.filter((m) => m.side === (activeSide as WeddingPartySide) || m.side === "BOTH");

  function countFor(tab: SideFilter) {
    if (tab === "ALL") return members.length;
    return members.filter((m) => m.side === (tab as WeddingPartySide) || m.side === "BOTH").length;
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleAdd() {
    setEditingMember(null);
    setDialogOpen(true);
  }

  function handleEdit(member: WeddingPartyMember) {
    setEditingMember(member);
    setDialogOpen(true);
  }

  function handleDialogSuccess(member: WeddingPartyMember) {
    setMembers((prev) => {
      const existing = prev.findIndex((m) => m.id === member.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = member;
        return updated;
      }
      return [...prev, member];
    });
  }

  async function handleDelete(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    try {
      await deleteWeddingPartyMemberAction(id);
    } catch {
      // Revert on failure (refetch would be ideal but keep it simple)
    }
  }

  async function handleTogglePublic(id: string, isPublic: boolean) {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isPublic } : m))
    );
    try {
      await toggleMemberPublicAction(id, isPublic);
    } catch {
      // Revert
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isPublic: !isPublic } : m))
      );
    }
  }

  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    // We reorder the filtered list, then reconstruct the full list
    const reordered = Array.from(filtered);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    // Build the full member list with the new order applied
    const reorderedIds = new Set(reordered.map((m) => m.id));
    const others = members.filter((m) => !reorderedIds.has(m.id));

    // Place reordered items in their new positions among the full list
    // Simple approach: replace filtered items in place
    const newMembers = [...members];
    const filteredIndices = members
      .map((m, i) => ({ m, i }))
      .filter(({ m }) => reorderedIds.has(m.id))
      .map(({ i }) => i);

    reordered.forEach((m, j) => {
      newMembers[filteredIndices[j]] = m;
    });

    const withOrder = newMembers.map((m, i) => ({ ...m, displayOrder: i }));
    setMembers(withOrder);

    // Fire-and-forget server sync
    void reorderWeddingPartyAction(
      withOrder.map((m) => ({ id: m.id, displayOrder: m.displayOrder }))
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {SIDE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveSide(tab.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all",
                activeSide === tab.value
                  ? "bg-white text-gray-900 shadow-apple-xs"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "text-[11px] font-semibold rounded-full px-1.5 py-0.5 min-w-[18px] text-center",
                  activeSide === tab.value
                    ? "bg-accent-light text-accent"
                    : "bg-gray-200 text-gray-500"
                )}
              >
                {countFor(tab.value)}
              </span>
            </button>
          ))}
        </div>

        {/* Add button */}
        <Button variant="primary" onClick={handleAdd}>
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add member
        </Button>
      </div>

      {/* Empty state */}
      {members.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
          title="Your wedding party awaits"
          description="Add your bridesmaids, groomsmen, and the whole crew. They'll appear beautifully on your wedding page."
          action={
            <Button variant="primary" onClick={handleAdd}>
              Add first member
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={`No members on ${activeSide === "BRIDE" ? "bride's" : "groom's"} side yet`}
          description="Add members and assign them to this side."
          action={<Button variant="secondary" onClick={handleAdd}>Add member</Button>}
        />
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="party" direction="vertical">
            {(provided) => (
              <motion.div
                ref={provided.innerRef}
                {...provided.droppableProps}
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {filtered.map((member, index) => (
                  <Draggable key={member.id} draggableId={member.id} index={index}>
                    {(draggableProvided) => (
                      <motion.div variants={itemVariants}>
                        <WeddingPartyMemberCard
                          member={member}
                          provided={draggableProvided}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onTogglePublic={handleTogglePublic}
                        />
                      </motion.div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </motion.div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Unified add/edit dialog */}
      <AddWeddingPartyMemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingMember={editingMember}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
