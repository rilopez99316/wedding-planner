// Wedding color palettes — each palette drives 4 CSS variables (as RGB triples
// for Tailwind opacity support) plus the --wedding-accent hex for buttons/links.
// The layout wrapper injects these as inline CSS custom properties so all
// Tailwind color classes (bg-ivory, text-navy, bg-gold, etc.) adapt automatically.

export type PaletteKey =
  | "classic-ivory"
  | "dusty-rose"
  | "sage-garden"
  | "midnight-romance"
  | "golden-terracotta"
  | "lavender-dream"
  | "ocean-mist"
  | "moody-burgundy";

export interface WeddingPalette {
  key: PaletteKey;
  name: string;
  mood: string;
  /** If true the page background is very dark; layout sets data-dark to flip text colors */
  dark: boolean;
  /** CSS variable values: space-separated R G B (no commas) for Tailwind alpha support */
  vars: {
    ivory: string;        // --w-ivory      → bg-ivory, backgrounds
    navy: string;         // --w-navy       → text-navy, headings, footer bg
    gold: string;         // --w-gold       → gold accents, dividers
    champagne: string;    // --w-champagne  → champagne tones
    heroStart: string;    // --w-hero-start → darkest shade for hero banner gradient
    heroMid: string;      // --w-hero-mid   → mid shade for hero banner gradient
    weddingAccent: string; // --wedding-accent hex → buttons, links
  };
  /** Hex colors shown in the picker swatches (for inline style, not Tailwind) */
  swatch: {
    bg: string;
    heading: string;
    accent: string;
    soft: string;
    footer: string;
  };
}

export const PALETTES: WeddingPalette[] = [
  {
    key: "classic-ivory",
    name: "Classic Ivory",
    mood: "Timeless & elegant",
    dark: false,
    vars: {
      ivory:        "253 250 245",
      navy:         "27 42 74",
      gold:         "201 168 76",
      champagne:    "245 230 200",
      heroStart:    "27 42 74",
      heroMid:      "10 18 38",
      weddingAccent: "#C9A84C",
    },
    swatch: {
      bg:      "#FDFAF5",
      heading: "#1B2A4A",
      accent:  "#C9A84C",
      soft:    "#F5E6C8",
      footer:  "#1B2A4A",
    },
  },
  {
    key: "dusty-rose",
    name: "Dusty Rose",
    mood: "Soft & romantic",
    dark: false,
    vars: {
      ivory:        "253 247 246",
      navy:         "89 31 47",
      gold:         "198 133 142",
      champagne:    "245 220 220",
      heroStart:    "74 21 32",
      heroMid:      "45 10 18",
      weddingAccent: "#C6858E",
    },
    swatch: {
      bg:      "#FDF7F6",
      heading: "#591F2F",
      accent:  "#C6858E",
      soft:    "#F5DCDC",
      footer:  "#591F2F",
    },
  },
  {
    key: "sage-garden",
    name: "Sage Garden",
    mood: "Fresh & botanical",
    dark: false,
    vars: {
      ivory:        "247 249 244",
      navy:         "41 65 52",
      gold:         "133 174 142",
      champagne:    "220 236 224",
      heroStart:    "25 42 33",
      heroMid:      "12 22 17",
      weddingAccent: "#85AE8E",
    },
    swatch: {
      bg:      "#F7F9F4",
      heading: "#294134",
      accent:  "#85AE8E",
      soft:    "#DCECE0",
      footer:  "#294134",
    },
  },
  {
    key: "midnight-romance",
    name: "Midnight Romance",
    mood: "Bold & dramatic",
    dark: true,
    vars: {
      ivory:        "15 15 20",
      navy:         "230 225 215",
      gold:         "196 168 84",
      champagne:    "60 55 40",
      heroStart:    "10 10 15",
      heroMid:      "5 5 10",
      weddingAccent: "#C4A854",
    },
    swatch: {
      bg:      "#0F0F14",
      heading: "#E6E1D7",
      accent:  "#C4A854",
      soft:    "#3C3728",
      footer:  "#080810",
    },
  },
  {
    key: "golden-terracotta",
    name: "Golden Terracotta",
    mood: "Warm & earthy",
    dark: false,
    vars: {
      ivory:        "252 247 240",
      navy:         "93 52 30",
      gold:         "194 109 61",
      champagne:    "245 220 190",
      heroStart:    "65 32 14",
      heroMid:      "38 14 4",
      weddingAccent: "#C26D3D",
    },
    swatch: {
      bg:      "#FCF7F0",
      heading: "#5D341E",
      accent:  "#C26D3D",
      soft:    "#F5DCBE",
      footer:  "#5D341E",
    },
  },
  {
    key: "lavender-dream",
    name: "Lavender Dream",
    mood: "Dreamy & ethereal",
    dark: false,
    vars: {
      ivory:        "249 246 255",
      navy:         "54 29 84",
      gold:         "148 103 189",
      champagne:    "220 210 240",
      heroStart:    "34 16 56",
      heroMid:      "18 6 34",
      weddingAccent: "#9467BD",
    },
    swatch: {
      bg:      "#F9F6FF",
      heading: "#361D54",
      accent:  "#9467BD",
      soft:    "#DCD2F0",
      footer:  "#361D54",
    },
  },
  {
    key: "ocean-mist",
    name: "Ocean Mist",
    mood: "Serene & coastal",
    dark: false,
    vars: {
      ivory:        "245 250 252",
      navy:         "21 62 80",
      gold:         "62 166 184",
      champagne:    "200 235 240",
      heroStart:    "14 42 56",
      heroMid:      "6 20 30",
      weddingAccent: "#3EA6B8",
    },
    swatch: {
      bg:      "#F5FAFC",
      heading: "#153E50",
      accent:  "#3EA6B8",
      soft:    "#C8EBF0",
      footer:  "#153E50",
    },
  },
  {
    key: "moody-burgundy",
    name: "Moody Burgundy",
    mood: "Rich & luxurious",
    dark: false,
    vars: {
      ivory:        "252 248 248",
      navy:         "72 17 38",
      gold:         "160 63 96",
      champagne:    "240 215 225",
      heroStart:    "50 8 22",
      heroMid:      "28 2 10",
      weddingAccent: "#A03F60",
    },
    swatch: {
      bg:      "#FCF8F8",
      heading: "#481126",
      accent:  "#A03F60",
      soft:    "#F0D7E1",
      footer:  "#481126",
    },
  },
];

export const DEFAULT_PALETTE_KEY: PaletteKey = "classic-ivory";

export function getPalette(key: string | null | undefined): WeddingPalette {
  return PALETTES.find((p) => p.key === key) ?? PALETTES[0];
}
