// Ceremony Module — item types, labels, colors, icons, and default program template

export type CeremonyItemType =
  | "processional"
  | "welcome"
  | "reading"
  | "prayer"
  | "music_moment"
  | "vows"
  | "rings"
  | "unity"
  | "pronouncement"
  | "recessional"
  | "custom";

export const CEREMONY_ITEM_TYPE_ORDER: CeremonyItemType[] = [
  "processional",
  "welcome",
  "reading",
  "prayer",
  "music_moment",
  "vows",
  "rings",
  "unity",
  "pronouncement",
  "recessional",
  "custom",
];

export const CEREMONY_ITEM_LABELS: Record<CeremonyItemType, string> = {
  processional:  "Processional",
  welcome:       "Welcome",
  reading:       "Reading",
  prayer:        "Prayer / Blessing",
  music_moment:  "Music",
  vows:          "Vows",
  rings:         "Ring Exchange",
  unity:         "Unity Ceremony",
  pronouncement: "Pronouncement",
  recessional:   "Recessional",
  custom:        "Custom",
};

export const CEREMONY_ITEM_COLORS: Record<CeremonyItemType, string> = {
  processional:  "#c9a84c", // gold
  welcome:       "#6b7280", // gray
  reading:       "#3b82f6", // blue
  prayer:        "#10b981", // green
  music_moment:  "#f97316", // orange
  vows:          "#ec4899", // pink
  rings:         "#c9a84c", // gold
  unity:         "#06b6d4", // cyan
  pronouncement: "#1b2a4a", // navy
  recessional:   "#c9a84c", // gold
  custom:        "#8b5cf6", // purple
};

export const CEREMONY_ITEM_ICONS: Record<CeremonyItemType, string> = {
  processional:  "💐",
  welcome:       "🙏",
  reading:       "📖",
  prayer:        "✝️",
  music_moment:  "🎵",
  vows:          "💍",
  rings:         "💎",
  unity:         "🕯️",
  pronouncement: "🎊",
  recessional:   "🎉",
  custom:        "✨",
};

// Default title suggestions when a type is selected
export const CEREMONY_ITEM_DEFAULT_TITLES: Record<CeremonyItemType, string> = {
  processional:  "Processional",
  welcome:       "Welcome",
  reading:       "Reading",
  prayer:        "Prayer / Blessing",
  music_moment:  "Musical Interlude",
  vows:          "Exchange of Vows",
  rings:         "Exchange of Rings",
  unity:         "Unity Ceremony",
  pronouncement: "Pronouncement",
  recessional:   "Recessional",
  custom:        "",
};

export type DefaultCeremonyItem = {
  type:        CeremonyItemType;
  title:       string;
  description: string;
  order:       number;
};

export const DEFAULT_CEREMONY_ITEMS: DefaultCeremonyItem[] = [
  {
    type:        "processional",
    title:       "Processional",
    description: "Wedding party and couple enter",
    order:       0,
  },
  {
    type:        "welcome",
    title:       "Welcome",
    description: "Officiant opens the ceremony and welcomes guests",
    order:       1,
  },
  {
    type:        "reading",
    title:       "Reading",
    description: "",
    order:       2,
  },
  {
    type:        "vows",
    title:       "Exchange of Vows",
    description: "Partners share their personal vows",
    order:       3,
  },
  {
    type:        "rings",
    title:       "Exchange of Rings",
    description: "Ring ceremony",
    order:       4,
  },
  {
    type:        "pronouncement",
    title:       "Pronouncement",
    description: "You are now married!",
    order:       5,
  },
  {
    type:        "recessional",
    title:       "Recessional",
    description: "Exit as newlyweds",
    order:       6,
  },
];
