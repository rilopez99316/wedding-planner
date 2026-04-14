"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import type { ClientGuest, ClientTable, SeatPosition } from "@/lib/types/seating";
import {
  assignGuestAction,
  unassignGuestAction,
  moveGuestAction,
  deleteTableAction,
  autoAssignAction,
  assignToSeatAction,
} from "@/lib/actions/seating";
import SeatingStatsBar from "./seating/SeatingStatsBar";
import UnassignedSidebar from "./seating/UnassignedSidebar";
import TableGrid from "./seating/TableGrid";
import AddTableDialog from "./seating/AddTableDialog";
import AssignGuestMenu from "./seating/AssignGuestMenu";
import SeatPickerMenu from "./seating/SeatPickerMenu";

interface SeatingClientProps {
  weddingId:       string;
  tables:          ClientTable[];
  confirmedGuests: ClientGuest[];
  guestMap:        Record<string, ClientGuest>;
  seatedGuestIds:  string[];
}

export default function SeatingClient({
  weddingId,
  tables: initialTables,
  confirmedGuests,
  guestMap,
  seatedGuestIds,
}: SeatingClientProps) {
  const router = useRouter();

  // ── Core state ─────────────────────────────────────────────────────────────
  const [tables, setTables] = useState<ClientTable[]>(initialTables);

  // Sync local state whenever the server re-fetches (e.g. after auto-assign)
  useEffect(() => {
    setTables(initialTables);
  }, [initialTables]);

  // ── Derived: unassigned guests ─────────────────────────────────────────────
  const seatedSet = useMemo(
    () => new Set(tables.flatMap((t) => t.guestIds)),
    [tables]
  );
  const unassignedGuests = useMemo(
    () => confirmedGuests.filter((g) => !seatedSet.has(g.id)),
    [confirmedGuests, seatedSet]
  );

  // ── Dialog / menu state ───────────────────────────────────────────────────
  const [tableDialogOpen, setTableDialogOpen] = useState(false);
  const [editingTable,    setEditingTable]    = useState<ClientTable | null>(null);
  const [assignGuest,     setAssignGuest]     = useState<ClientGuest | null>(null);
  const [assignTableId,   setAssignTableId]   = useState<string | undefined>(undefined);
  const [sidebarOpen,     setSidebarOpen]     = useState(false);

  // Seat picker state
  const [seatPicker, setSeatPicker] = useState<{
    tableId:         string;
    seatNumber:      number;
    occupiedGuestId: string | null;
  } | null>(null);

  // ── Loading / error state ─────────────────────────────────────────────────
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [errorBanner,     setErrorBanner]     = useState("");

  function showError(msg: string) {
    setErrorBanner(msg);
    setTimeout(() => setErrorBanner(""), 4000);
  }

  // ── Table dialog handlers ─────────────────────────────────────────────────

  function handleAddTable() {
    setEditingTable(null);
    setTableDialogOpen(true);
  }

  function handleEditTable(table: ClientTable) {
    setEditingTable(table);
    setTableDialogOpen(true);
  }

  function handleTableSuccess(table: ClientTable) {
    setTables((prev) => {
      const idx = prev.findIndex((t) => t.id === table.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...table, guestIds: prev[idx].guestIds, seatPositions: prev[idx].seatPositions };
        return updated;
      }
      return [...prev, table];
    });
  }

  async function handleDeleteTable(tableId: string) {
    const snapshot = tables;
    setTables((prev) => prev.filter((t) => t.id !== tableId));
    try {
      await deleteTableAction(tableId);
    } catch (err) {
      setTables(snapshot);
      showError(err instanceof Error ? err.message : "Failed to delete table.");
    }
  }

  // ── Assignment handlers ───────────────────────────────────────────────────

  function handleOpenAssignMenu(guest: ClientGuest, currentTableId?: string) {
    setAssignGuest(guest);
    setAssignTableId(currentTableId);
  }

  async function handleAssignToTable(guestId: string, tableId: string, fromTableId?: string) {
    const snapshot = tables;
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === fromTableId) {
          return {
            ...t,
            guestIds:      t.guestIds.filter((id) => id !== guestId),
            seatPositions: t.seatPositions.filter((sp) => sp.guestId !== guestId),
          };
        }
        if (t.id === tableId) {
          // Assign to next available seat optimistically
          const usedSeats = new Set(t.seatPositions.map((sp) => sp.seatNumber));
          let next = 1;
          while (usedSeats.has(next)) next++;
          return {
            ...t,
            guestIds:      [...t.guestIds, guestId],
            seatPositions: [...t.seatPositions, { seatNumber: next, guestId }],
          };
        }
        return t;
      })
    );
    try {
      if (fromTableId) {
        await moveGuestAction(fromTableId, tableId, guestId);
      } else {
        await assignGuestAction(tableId, guestId);
      }
    } catch (err) {
      setTables(snapshot);
      showError(err instanceof Error ? err.message : "Failed to assign guest.");
    }
  }

  async function handleUnassignGuest(tableId: string, guestId: string) {
    const snapshot = tables;
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              guestIds:      t.guestIds.filter((id) => id !== guestId),
              seatPositions: t.seatPositions.filter((sp) => sp.guestId !== guestId),
            }
          : t
      )
    );
    try {
      await unassignGuestAction(guestId);
    } catch (err) {
      setTables(snapshot);
      showError(err instanceof Error ? err.message : "Failed to unassign guest.");
    }
  }

  // ── Seat assignment ───────────────────────────────────────────────────────

  function handleOpenSeatPicker(
    tableId: string,
    seatNumber: number,
    occupiedGuestId: string | null
  ) {
    setSeatPicker({ tableId, seatNumber, occupiedGuestId });
  }

  async function handleAssignToSeat(guestId: string) {
    if (!seatPicker) return;
    const { tableId, seatNumber } = seatPicker;

    const snapshot = tables;
    setTables((prev) =>
      prev.map((t) => {
        if (t.id !== tableId) return t;
        // Remove any existing entry for this seatNumber
        const filtered = t.seatPositions.filter((sp) => sp.seatNumber !== seatNumber);
        return {
          ...t,
          guestIds:      [...t.guestIds.filter((id) => id !== guestId), guestId],
          seatPositions: [...filtered, { seatNumber, guestId }].sort(
            (a, b) => a.seatNumber - b.seatNumber
          ),
        };
      })
    );

    try {
      await assignToSeatAction(tableId, seatNumber, guestId);
    } catch (err) {
      setTables(snapshot);
      showError(err instanceof Error ? err.message : "Failed to assign to seat.");
    }
  }

  async function handleUnassignFromSeat() {
    if (!seatPicker?.occupiedGuestId) return;
    const { tableId, seatNumber, occupiedGuestId } = seatPicker;

    const snapshot = tables;
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              guestIds:      t.guestIds.filter((id) => id !== occupiedGuestId),
              seatPositions: t.seatPositions.filter((sp) => sp.seatNumber !== seatNumber),
            }
          : t
      )
    );

    try {
      await assignToSeatAction(tableId, seatNumber, null);
    } catch (err) {
      setTables(snapshot);
      showError(err instanceof Error ? err.message : "Failed to remove from seat.");
    }
  }

  // ── Auto-assign ───────────────────────────────────────────────────────────

  async function handleAutoAssign() {
    setIsAutoAssigning(true);
    try {
      const result = await autoAssignAction();
      router.refresh();
      if (result.guestsSeated === 0) {
        showError("No unassigned guests to seat, or no tables with available seats.");
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Auto-assign failed.");
    } finally {
      setIsAutoAssigning(false);
    }
  }

  // ── DnD ──────────────────────────────────────────────────────────────────

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, draggableId: guestId } = result;
      if (!destination) return;
      if (source.droppableId === destination.droppableId && source.index === destination.index) return;

      const srcId  = source.droppableId;
      const destId = destination.droppableId;

      if (srcId === destId) {
        if (srcId === "unassigned") return;
        return;
      }

      const srcIsTable  = srcId.startsWith("table-");
      const destIsTable = destId.startsWith("table-");
      const srcTableId  = srcIsTable  ? srcId.slice("table-".length)  : null;
      const destTableId = destIsTable ? destId.slice("table-".length) : null;

      if (destIsTable) {
        const destTable = tables.find((t) => t.id === destTableId);
        if (!destTable) return;
        const wouldAdd = !destTable.guestIds.includes(guestId);
        if (wouldAdd && destTable.guestIds.length >= destTable.capacity) {
          showError(`${destTable.name} is at full capacity (${destTable.capacity} seats).`);
          return;
        }
      }

      if (srcId === "unassigned" && destIsTable && destTableId) {
        void handleAssignToTable(guestId, destTableId, undefined);
      } else if (srcIsTable && destId === "unassigned" && srcTableId) {
        void handleUnassignGuest(srcTableId, guestId);
      } else if (srcIsTable && destIsTable && srcTableId && destTableId) {
        void handleAssignToTable(guestId, destTableId, srcTableId);
      }
    },
    [tables] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Render ────────────────────────────────────────────────────────────────

  const seatedCount = seatedSet.size;
  const totalCount  = confirmedGuests.length;

  const seatPickerTable    = seatPicker ? tables.find((t) => t.id === seatPicker.tableId) : null;
  const seatPickerGuest    = seatPicker?.occupiedGuestId ? guestMap[seatPicker.occupiedGuestId] ?? null : null;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {/* Error banner */}
      {errorBanner && (
        <div className="mb-3 px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
          {errorBanner}
        </div>
      )}

      {/* Toolbar */}
      <SeatingStatsBar
        seatedCount={seatedCount}
        totalCount={totalCount}
        onAutoAssign={handleAutoAssign}
        isAutoAssigning={isAutoAssigning}
        onAddTable={handleAddTable}
      />

      {/* Main layout: sidebar + grid */}
      <div className="flex gap-4 items-start">
        <UnassignedSidebar
          unassignedGuests={unassignedGuests}
          onClickAssign={(guest) => handleOpenAssignMenu(guest)}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 min-w-0">
          <TableGrid
            tables={tables}
            guestMap={guestMap}
            onEditTable={handleEditTable}
            onDeleteTable={handleDeleteTable}
            onRemoveGuest={(tableId, guestId) => handleUnassignGuest(tableId, guestId)}
            onClickAssign={(guest) => {
              const currentTableId = tables.find((t) => t.guestIds.includes(guest.id))?.id;
              handleOpenAssignMenu(guest, currentTableId);
            }}
            onClickSeat={handleOpenSeatPicker}
          />
        </div>
      </div>

      {/* Mobile: floating pill to open sidebar */}
      {unassignedGuests.length > 0 && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 md:hidden flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-full shadow-apple-lg z-20"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
          {unassignedGuests.length} unassigned
        </button>
      )}

      {/* Dialogs */}
      <AddTableDialog
        open={tableDialogOpen}
        onOpenChange={setTableDialogOpen}
        editingTable={editingTable}
        onSuccess={handleTableSuccess}
      />

      {assignGuest && (
        <AssignGuestMenu
          guest={assignGuest}
          tables={tables}
          open={!!assignGuest}
          onOpenChange={(v) => { if (!v) setAssignGuest(null); }}
          onAssign={async (tableId) => {
            await handleAssignToTable(assignGuest.id, tableId, assignTableId);
          }}
          currentTableId={assignTableId}
        />
      )}

      {seatPicker && seatPickerTable && (
        <SeatPickerMenu
          open={!!seatPicker}
          onOpenChange={(v) => { if (!v) setSeatPicker(null); }}
          tableName={seatPickerTable.name}
          seatNumber={seatPicker.seatNumber}
          occupiedGuest={seatPickerGuest}
          unassignedGuests={unassignedGuests}
          onAssign={handleAssignToSeat}
          onUnassign={handleUnassignFromSeat}
        />
      )}
    </DragDropContext>
  );
}
