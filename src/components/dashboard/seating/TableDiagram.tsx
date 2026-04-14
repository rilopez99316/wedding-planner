"use client";

import type { SeatPosition } from "@/lib/types/seating";

interface TableDiagramProps {
  shape:         "ROUND" | "RECTANGULAR";
  capacity:      number;
  seatPositions: SeatPosition[];
  guestMap:      Record<string, { firstName: string; lastName: string }>;
  dotColor:      string; // hex, e.g. "#fb7185"
  surfaceHex:    string; // hex, e.g. "#fff1f2"
  /** Called when the user clicks a seat circle. */
  onSeatClick?:  (seatNumber: number, occupiedGuestId: string | null) => void;
  /** Seat number currently highlighted (e.g. open picker). */
  activeSeat?:   number | null;
}

/** Renders a top-down floor-plan view of a table with filled/empty seats. */
export default function TableDiagram({
  shape,
  capacity,
  seatPositions,
  guestMap,
  dotColor,
  surfaceHex,
  onSeatClick,
  activeSeat,
}: TableDiagramProps) {
  // Cap display at 16 so the diagram stays legible on small cards
  const displayCap = Math.min(capacity, 16);

  // Build a quick lookup: seatNumber → guestId
  const seatMap: Record<number, string> = {};
  for (const sp of seatPositions) {
    if (sp.seatNumber <= displayCap) {
      seatMap[sp.seatNumber] = sp.guestId;
    }
  }

  const interactive = !!onSeatClick;

  if (shape === "ROUND") {
    return (
      <RoundDiagram
        cap={displayCap}
        seatMap={seatMap}
        guestMap={guestMap}
        dotColor={dotColor}
        surfaceHex={surfaceHex}
        onSeatClick={interactive ? onSeatClick : undefined}
        activeSeat={activeSeat}
      />
    );
  }
  return (
    <RectDiagram
      cap={displayCap}
      seatMap={seatMap}
      guestMap={guestMap}
      dotColor={dotColor}
      surfaceHex={surfaceHex}
      onSeatClick={interactive ? onSeatClick : undefined}
      activeSeat={activeSeat}
    />
  );
}

// ── Shared seat click handler ─────────────────────────────────────────────────

type SeatProps = {
  seatNumber:   number;
  cx:           number;
  cy:           number;
  r:            number;
  guestId:      string | null;
  guestInitials: string | null;
  dotColor:     string;
  onSeatClick?: (seatNumber: number, occupiedGuestId: string | null) => void;
  isActive:     boolean;
};

function Seat({ seatNumber, cx, cy, r, guestId, guestInitials, dotColor, onSeatClick, isActive }: SeatProps) {
  const clickable = !!onSeatClick;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSeatClick?.(seatNumber, guestId);
  };

  return (
    <g
      onClick={clickable ? handleClick : undefined}
      style={{ cursor: clickable ? "pointer" : "default" }}
      role={clickable ? "button" : undefined}
      aria-label={clickable ? (guestId ? `Seat ${seatNumber}: ${guestInitials}` : `Empty seat ${seatNumber}`) : undefined}
    >
      {/* Active ring */}
      {isActive && (
        <circle
          cx={cx} cy={cy} r={r + 3}
          fill="none"
          stroke={dotColor}
          strokeWidth="1.5"
          strokeDasharray="3 2"
          opacity="0.7"
        />
      )}
      <circle
        cx={cx} cy={cy} r={r}
        fill={guestId ? dotColor : "white"}
        fillOpacity={guestId ? 0.85 : 1}
        stroke={dotColor}
        strokeWidth={isActive ? "2" : "1.5"}
        strokeDasharray={guestId ? undefined : "3 2"}
      />
      {guestId && guestInitials && (
        <text
          x={cx} y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={r > 8 ? "5.5" : "5"}
          fontWeight="700"
          fill="white"
          fontFamily="system-ui, sans-serif"
          style={{ pointerEvents: "none" }}
        >
          {guestInitials}
        </text>
      )}
      {/* Hover/empty "+" hint when clickable and empty */}
      {clickable && !guestId && (
        <text
          x={cx} y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="8"
          fill={dotColor}
          fillOpacity="0.4"
          fontFamily="system-ui, sans-serif"
          style={{ pointerEvents: "none" }}
        >
          +
        </text>
      )}
    </g>
  );
}

function getInitials(
  seatMap: Record<number, string>,
  guestMap: Record<string, { firstName: string; lastName: string }>,
  seatNumber: number
): { guestId: string | null; initials: string | null } {
  const guestId = seatMap[seatNumber] ?? null;
  if (!guestId) return { guestId: null, initials: null };
  const g = guestMap[guestId];
  if (!g) return { guestId, initials: "?" };
  return {
    guestId,
    initials: `${g.firstName[0]?.toUpperCase() ?? ""}${g.lastName[0]?.toUpperCase() ?? ""}`,
  };
}

// ── Round table ────────────────────────────────────────────────────────────────

function RoundDiagram({
  cap,
  seatMap,
  guestMap,
  dotColor,
  surfaceHex,
  onSeatClick,
  activeSeat,
}: {
  cap: number;
  seatMap: Record<number, string>;
  guestMap: Record<string, { firstName: string; lastName: string }>;
  dotColor: string;
  surfaceHex: string;
  onSeatClick?: (seatNumber: number, occupiedGuestId: string | null) => void;
  activeSeat?: number | null;
}) {
  const centerX = 60, centerY = 60, tableR = 22, orbitR = 44, seatR = 9;

  const seats = Array.from({ length: cap }, (_, i) => {
    const seatNumber = i + 1;
    const angle      = (2 * Math.PI / cap) * i - Math.PI / 2;
    const { guestId, initials } = getInitials(seatMap, guestMap, seatNumber);
    return { seatNumber, cx: centerX + orbitR * Math.cos(angle), cy: centerY + orbitR * Math.sin(angle), guestId, initials };
  });

  return (
    <svg viewBox="0 0 120 120" className="w-full h-full" aria-hidden={!onSeatClick}>
      {/* Table surface */}
      <circle cx={centerX} cy={centerY} r={tableR} fill={surfaceHex} stroke={dotColor} strokeWidth="1.5" />
      <circle cx={centerX} cy={centerY} r={tableR - 4} fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.6" />

      {seats.map((s) => (
        <Seat
          key={s.seatNumber}
          seatNumber={s.seatNumber}
          cx={s.cx} cy={s.cy} r={seatR}
          guestId={s.guestId}
          guestInitials={s.initials}
          dotColor={dotColor}
          onSeatClick={onSeatClick}
          isActive={activeSeat === s.seatNumber}
        />
      ))}
    </svg>
  );
}

// ── Rectangular table ─────────────────────────────────────────────────────────

function RectDiagram({
  cap,
  seatMap,
  guestMap,
  dotColor,
  surfaceHex,
  onSeatClick,
  activeSeat,
}: {
  cap: number;
  seatMap: Record<number, string>;
  guestMap: Record<string, { firstName: string; lastName: string }>;
  dotColor: string;
  surfaceHex: string;
  onSeatClick?: (seatNumber: number, occupiedGuestId: string | null) => void;
  activeSeat?: number | null;
}) {
  const seatR    = 8;
  const sideMax  = Math.floor(cap / 2);
  const hasEnd   = cap % 2 === 1;

  function rowX(index: number, count: number) {
    if (count === 1) return 60;
    return 24 + (index * 72) / (count - 1);
  }

  const allSeats: { seatNumber: number; cx: number; cy: number }[] = [];

  for (let i = 0; i < sideMax; i++) {
    allSeats.push({ seatNumber: i + 1, cx: rowX(i, sideMax), cy: 28 });
  }
  for (let i = 0; i < sideMax; i++) {
    allSeats.push({ seatNumber: sideMax + i + 1, cx: rowX(i, sideMax), cy: 92 });
  }
  if (hasEnd) {
    allSeats.push({ seatNumber: cap, cx: 9, cy: 60 });
  }

  return (
    <svg viewBox="0 0 120 120" className="w-full h-full" aria-hidden={!onSeatClick}>
      <rect x="18" y="38" width="84" height="44" rx="5" fill={surfaceHex} stroke={dotColor} strokeWidth="1.5" />
      <rect x="23" y="43" width="74" height="34" rx="3" fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.5" />

      {allSeats.map((s) => {
        const { guestId, initials } = getInitials(seatMap, guestMap, s.seatNumber);
        return (
          <Seat
            key={s.seatNumber}
            seatNumber={s.seatNumber}
            cx={s.cx} cy={s.cy} r={seatR}
            guestId={guestId}
            guestInitials={initials}
            dotColor={dotColor}
            onSeatClick={onSeatClick}
            isActive={activeSeat === s.seatNumber}
          />
        );
      })}
    </svg>
  );
}
