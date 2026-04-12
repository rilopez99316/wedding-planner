"use client";

import { motion } from "framer-motion";
import type { ClientGuest, ClientTable } from "@/lib/types/seating";
import TableCard from "./TableCard";

const containerVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show:   {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 26 },
  },
};

interface TableGridProps {
  tables:        ClientTable[];
  guestMap:      Record<string, ClientGuest>;
  onEditTable:   (table: ClientTable) => void;
  onDeleteTable: (tableId: string) => void;
  onRemoveGuest: (tableId: string, guestId: string) => void;
  onClickAssign: (guest: ClientGuest) => void;
}

export default function TableGrid({
  tables,
  guestMap,
  onEditTable,
  onDeleteTable,
  onRemoveGuest,
  onClickAssign,
}: TableGridProps) {
  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">🪑</div>
        <p className="text-base font-medium text-gray-700">No tables yet</p>
        <p className="text-sm text-gray-400 mt-1 max-w-xs">
          Click &ldquo;Add Table&rdquo; above to create your first table, then drag guests in from the sidebar.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
    >
      {tables.map((table) => {
        const guests = table.guestIds.map((id) => guestMap[id]).filter(Boolean) as ClientGuest[];
        return (
          <motion.div key={table.id} variants={itemVariants}>
            <TableCard
              table={table}
              guests={guests}
              guestMap={guestMap}
              onEdit={() => onEditTable(table)}
              onDelete={() => onDeleteTable(table.id)}
              onRemoveGuest={(guestId) => onRemoveGuest(table.id, guestId)}
              onClickAssign={onClickAssign}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
