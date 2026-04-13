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
  onClickSeat:   (tableId: string, seatNumber: number, occupiedGuestId: string | null) => void;
}

export default function TableGrid({
  tables,
  guestMap,
  onEditTable,
  onDeleteTable,
  onRemoveGuest,
  onClickAssign,
  onClickSeat,
}: TableGridProps) {
  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        {/* Illustrated venue SVG */}
        <svg
          viewBox="0 0 220 140"
          className="w-52 h-auto mb-6 opacity-90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          {/* Venue backdrop */}
          <rect x="20" y="45" width="180" height="85" rx="10" fill="#fce7f3" stroke="#f9a8d4" strokeWidth="1.5" />

          {/* Arch / curtain top */}
          <path d="M20 55 Q110 8 200 55" fill="#fbcfe8" stroke="#f9a8d4" strokeWidth="1.5" />

          {/* String lights along arch */}
          {([38, 60, 82, 110, 138, 160, 182] as number[]).map((x, i) => (
            <circle key={i} cx={x} cy={i % 2 === 0 ? 34 : 38} r="2.5" fill="#fbbf24" />
          ))}
          {/* Light strings */}
          <path d="M38 34 Q74 40 110 38 Q146 36 182 38" stroke="#fde68a" strokeWidth="0.8" fill="none" />

          {/* Three empty round tables */}
          <circle cx="72"  cy="96" r="22" fill="#fff1f2" stroke="#fb7185" strokeWidth="1.5" strokeDasharray="5 3" />
          <circle cx="148" cy="96" r="22" fill="#f5f3ff" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="5 3" />
          <circle cx="110" cy="75" r="17" fill="#fffbeb" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="5 3" />

          {/* Empty seat rings around tables */}
          {([0, 1, 2, 3, 4, 5] as number[]).map((i) => {
            const a = (2 * Math.PI / 6) * i - Math.PI / 2;
            return (
              <circle
                key={i}
                cx={72 + 29 * Math.cos(a)}
                cy={96 + 29 * Math.sin(a)}
                r="4"
                fill="white"
                stroke="#fda4af"
                strokeWidth="1"
                strokeDasharray="2 1.5"
              />
            );
          })}
          {([0, 1, 2, 3, 4, 5] as number[]).map((i) => {
            const a = (2 * Math.PI / 6) * i - Math.PI / 2;
            return (
              <circle
                key={i}
                cx={148 + 29 * Math.cos(a)}
                cy={96 + 29 * Math.sin(a)}
                r="4"
                fill="white"
                stroke="#c4b5fd"
                strokeWidth="1"
                strokeDasharray="2 1.5"
              />
            );
          })}
          {([0, 1, 2, 3, 4] as number[]).map((i) => {
            const a = (2 * Math.PI / 5) * i - Math.PI / 2;
            return (
              <circle
                key={i}
                cx={110 + 23 * Math.cos(a)}
                cy={75 + 23 * Math.sin(a)}
                r="3.5"
                fill="white"
                stroke="#fcd34d"
                strokeWidth="1"
                strokeDasharray="2 1.5"
              />
            );
          })}

          {/* Small floral/star accents */}
          <text x="106" y="79" fontSize="8" textAnchor="middle" dominantBaseline="central">✿</text>
          <text x="68"  y="99" fontSize="8" textAnchor="middle" dominantBaseline="central">✿</text>
          <text x="144" y="99" fontSize="8" textAnchor="middle" dominantBaseline="central">✿</text>
        </svg>

        <p className="text-base font-semibold text-gray-800">Your venue awaits ✨</p>
        <p className="text-sm text-gray-400 mt-1.5 max-w-[260px] leading-relaxed">
          Add your first table above and start arranging your guests — it&rsquo;s easier than you think!
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
              onClickSeat={(seatNumber, occupiedGuestId) =>
                onClickSeat(table.id, seatNumber, occupiedGuestId)
              }
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
