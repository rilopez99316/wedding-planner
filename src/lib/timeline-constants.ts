// Day-of Timeline — constants, categories, default template, and helper functions

export type TimelineCategory =
  | "getting_ready"
  | "travel"
  | "ceremony"
  | "photos"
  | "cocktail_hour"
  | "reception"
  | "other";

export const TIMELINE_CATEGORY_ORDER: TimelineCategory[] = [
  "getting_ready",
  "travel",
  "ceremony",
  "photos",
  "cocktail_hour",
  "reception",
  "other",
];

export const TIMELINE_CATEGORY_LABELS: Record<TimelineCategory, string> = {
  getting_ready: "Getting Ready",
  travel:        "Travel",
  ceremony:      "Ceremony",
  photos:        "Photos",
  cocktail_hour: "Cocktail Hour",
  reception:     "Reception",
  other:         "Other",
};

// Hex colors — harmonious with the design system
export const TIMELINE_CATEGORY_COLORS: Record<TimelineCategory, string> = {
  getting_ready: "#ec4899", // pink
  travel:        "#f97316", // orange
  ceremony:      "#c9a84c", // gold (matches design system)
  photos:        "#8b5cf6", // purple
  cocktail_hour: "#06b6d4", // cyan
  reception:     "#1b2a4a", // navy (matches design system)
  other:         "#6b7280", // gray
};

export const TIMELINE_CATEGORY_ICONS: Record<TimelineCategory, string> = {
  getting_ready: "💄",
  travel:        "🚗",
  ceremony:      "💒",
  photos:        "📸",
  cocktail_hour: "🥂",
  reception:     "🎉",
  other:         "📋",
};

// ── Default Template Events ────────────────────────────────────────────────
// offsetHours: hours from midnight on the wedding date (e.g. 8 = 8:00 AM, 14.5 = 2:30 PM)

export type DefaultTemplateEvent = {
  title:           string;
  category:        TimelineCategory;
  offsetHours:     number;
  durationMinutes: number;
  location?:       string;
  assignedTo?:     string;
  notes?:          string;
  order:           number;
};

export const DEFAULT_TIMELINE_EVENTS: DefaultTemplateEvent[] = [
  {
    title:           "Hair & makeup begins",
    category:        "getting_ready",
    offsetHours:     8,
    durationMinutes: 210,
    assignedTo:      "Hair & makeup artist",
    notes:           "Bridal party starts first, bride last",
    order:           0,
  },
  {
    title:           "Bride gets into dress",
    category:        "getting_ready",
    offsetHours:     11.5,
    durationMinutes: 30,
    notes:           "Bridal party helps with dress and final touches",
    order:           1,
  },
  {
    title:           "First look photos",
    category:        "photos",
    offsetHours:     12,
    durationMinutes: 30,
    assignedTo:      "Photographer",
    order:           2,
  },
  {
    title:           "Wedding party portraits",
    category:        "photos",
    offsetHours:     12.5,
    durationMinutes: 60,
    assignedTo:      "Photographer",
    order:           3,
  },
  {
    title:           "Travel to ceremony venue",
    category:        "travel",
    offsetHours:     14,
    durationMinutes: 30,
    order:           4,
  },
  {
    title:           "Guests arrive",
    category:        "ceremony",
    offsetHours:     14.5,
    durationMinutes: 30,
    notes:           "Ushers guide guests to seats",
    order:           5,
  },
  {
    title:           "Ceremony begins",
    category:        "ceremony",
    offsetHours:     15,
    durationMinutes: 45,
    order:           6,
  },
  {
    title:           "Cocktail hour",
    category:        "cocktail_hour",
    offsetHours:     16,
    durationMinutes: 60,
    notes:           "Catering team sets up reception room during this time",
    order:           7,
  },
  {
    title:           "Couple portraits — golden hour",
    category:        "photos",
    offsetHours:     16.25,
    durationMinutes: 45,
    assignedTo:      "Photographer",
    notes:           "Sneak away from cocktail hour for golden hour shots",
    order:           8,
  },
  {
    title:           "Grand entrance & first dance",
    category:        "reception",
    offsetHours:     17,
    durationMinutes: 20,
    assignedTo:      "DJ / Band",
    order:           9,
  },
  {
    title:           "Dinner service",
    category:        "reception",
    offsetHours:     17.5,
    durationMinutes: 90,
    assignedTo:      "Catering team",
    order:           10,
  },
  {
    title:           "Toasts & speeches",
    category:        "reception",
    offsetHours:     18,
    durationMinutes: 30,
    notes:           "MOH, Best Man, and parents",
    order:           11,
  },
  {
    title:           "Cake cutting",
    category:        "reception",
    offsetHours:     19.5,
    durationMinutes: 15,
    assignedTo:      "Caterer",
    order:           12,
  },
  {
    title:           "Dancing & festivities",
    category:        "reception",
    offsetHours:     20,
    durationMinutes: 150,
    assignedTo:      "DJ / Band",
    order:           13,
  },
  {
    title:           "Grand sendoff",
    category:        "other",
    offsetHours:     23,
    durationMinutes: 30,
    notes:           "Sparkler exit or petal toss — coordinate with guests in advance",
    order:           14,
  },
];

// ── Helper Functions ────────────────────────────────────────────────────────

/**
 * Build a full DateTime from a wedding date + decimal hour offset.
 * e.g. buildEventDateTime(weddingDate, 14.5) → 2:30 PM on the wedding date
 */
export function buildEventDateTime(weddingDate: Date, offsetHours: number): Date {
  const d = new Date(weddingDate);
  const hours   = Math.floor(offsetHours);
  const minutes = Math.round((offsetHours - hours) * 60);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * Format a duration in minutes as a human-readable string.
 * e.g. 45 → "45 min", 90 → "1 hr 30 min", 60 → "1 hr"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs  = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs} hr`;
  return `${hrs} hr ${mins} min`;
}

/**
 * Calculate duration in minutes between two DateTimes (or ISO strings).
 */
export function calcDurationMinutes(
  start: Date | string,
  end:   Date | string,
): number {
  return Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 60000,
  );
}

/**
 * Calculate gap in minutes between end of event A and start of event B.
 * Returns null if A has no endTime.
 * Negative value = events overlap.
 */
export function calcGapMinutes(
  aEnd:   Date | string | null | undefined,
  bStart: Date | string,
): number | null {
  if (!aEnd) return null;
  return Math.round(
    (new Date(bStart).getTime() - new Date(aEnd).getTime()) / 60000,
  );
}
