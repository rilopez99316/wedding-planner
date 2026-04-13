/**
 * Wedding seating chart color palette.
 * Fully-written class strings so Tailwind's content scanner can detect them.
 */

export const TABLE_PALETTE = [
  {
    id:         "rose",
    bg:         "bg-rose-50",
    border:     "border-rose-200",
    header:     "bg-rose-100",
    ring:       "ring-rose-300",
    text:       "text-rose-700",
    dot:        "#fb7185",
    surfaceHex: "#fff1f2",
  },
  {
    id:         "violet",
    bg:         "bg-violet-50",
    border:     "border-violet-200",
    header:     "bg-violet-100",
    ring:       "ring-violet-300",
    text:       "text-violet-700",
    dot:        "#a78bfa",
    surfaceHex: "#f5f3ff",
  },
  {
    id:         "sky",
    bg:         "bg-sky-50",
    border:     "border-sky-200",
    header:     "bg-sky-100",
    ring:       "ring-sky-300",
    text:       "text-sky-700",
    dot:        "#38bdf8",
    surfaceHex: "#f0f9ff",
  },
  {
    id:         "emerald",
    bg:         "bg-emerald-50",
    border:     "border-emerald-200",
    header:     "bg-emerald-100",
    ring:       "ring-emerald-300",
    text:       "text-emerald-700",
    dot:        "#34d399",
    surfaceHex: "#ecfdf5",
  },
  {
    id:         "amber",
    bg:         "bg-amber-50",
    border:     "border-amber-200",
    header:     "bg-amber-100",
    ring:       "ring-amber-300",
    text:       "text-amber-700",
    dot:        "#fbbf24",
    surfaceHex: "#fffbeb",
  },
  {
    id:         "pink",
    bg:         "bg-pink-50",
    border:     "border-pink-200",
    header:     "bg-pink-100",
    ring:       "ring-pink-300",
    text:       "text-pink-700",
    dot:        "#f472b6",
    surfaceHex: "#fdf2f8",
  },
  {
    id:         "teal",
    bg:         "bg-teal-50",
    border:     "border-teal-200",
    header:     "bg-teal-100",
    ring:       "ring-teal-300",
    text:       "text-teal-700",
    dot:        "#2dd4bf",
    surfaceHex: "#f0fdfa",
  },
  {
    id:         "indigo",
    bg:         "bg-indigo-50",
    border:     "border-indigo-200",
    header:     "bg-indigo-100",
    ring:       "ring-indigo-300",
    text:       "text-indigo-700",
    dot:        "#818cf8",
    surfaceHex: "#eef2ff",
  },
] as const;

export type PaletteEntry = (typeof TABLE_PALETTE)[number];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Stable palette entry derived from the table's id (UUID). */
export function paletteForTable(tableId: string): PaletteEntry {
  return TABLE_PALETTE[hashString(tableId) % TABLE_PALETTE.length];
}

// ── Guest avatar palette ──────────────────────────────────────────────────────

export const GUEST_AVATAR_PALETTE = [
  { bg: "bg-rose-100",    text: "text-rose-700"    },
  { bg: "bg-violet-100",  text: "text-violet-700"  },
  { bg: "bg-pink-100",    text: "text-pink-700"    },
  { bg: "bg-amber-100",   text: "text-amber-700"   },
  { bg: "bg-teal-100",    text: "text-teal-700"    },
  { bg: "bg-sky-100",     text: "text-sky-700"     },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-indigo-100",  text: "text-indigo-700"  },
] as const;

export type AvatarPaletteEntry = (typeof GUEST_AVATAR_PALETTE)[number];

/** Stable avatar color derived from the guest's name. */
export function avatarPaletteForName(
  firstName: string,
  lastName: string
): AvatarPaletteEntry {
  return GUEST_AVATAR_PALETTE[
    hashString(`${firstName}${lastName}`) % GUEST_AVATAR_PALETTE.length
  ];
}
