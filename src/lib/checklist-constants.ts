export const CATEGORY_ORDER = [
  "12_plus",
  "9_12",
  "6_9",
  "4_6",
  "2_4",
  "6_8_weeks",
  "2_4_weeks",
  "1_week",
  "day_of",
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  "12_plus":   "#8b5cf6",
  "9_12":      "#3b82f6",
  "6_9":       "#06b6d4",
  "4_6":       "#10b981",
  "2_4":       "#f59e0b",
  "6_8_weeks": "#f97316",
  "2_4_weeks": "#ef4444",
  "1_week":    "#ec4899",
  "day_of":    "#c9a84c",
};

export const CATEGORY_EMOJIS: Record<string, string> = {
  "12_plus":   "🏛️",
  "9_12":      "📸",
  "6_9":       "👗",
  "4_6":       "💐",
  "2_4":       "💌",
  "6_8_weeks": "📋",
  "2_4_weeks": "🎀",
  "1_week":    "🥂",
  "day_of":    "💒",
};

export const CATEGORY_LABELS: Record<string, string> = {
  "12_plus":   "12+ Months Before",
  "9_12":      "9–12 Months Before",
  "6_9":       "6–9 Months Before",
  "4_6":       "4–6 Months Before",
  "2_4":       "2–4 Months Before",
  "6_8_weeks": "6–8 Weeks Before",
  "2_4_weeks": "2–4 Weeks Before",
  "1_week":    "1 Week Before",
  "day_of":    "Wedding Day",
};

export const STALE_TITLES = new Set([
  "Start planning the honeymoon",
  "Finalize and confirm honeymoon bookings",
  "Plan and book rehearsal dinner",
  "Confirm final headcount with caterer and venue",
  "Confirm all vendor arrival times and logistics",
  "Book engagement photo session (if not done)",
  "Research and tour ceremony venues",
  "Research and tour reception venues",
  "Purchase wedding jewelry and accessories",
  "Create vendor contact sheet with arrival times",
  "Decide on wedding date and time of year",
]);

export function getProgressMessage(pct: number): string {
  if (pct === 0)   return "Your planning journey starts here ✦";
  if (pct < 20)    return "What a beautiful beginning!";
  if (pct < 40)    return "You're making wonderful progress!";
  if (pct < 60)    return "Halfway to the best day of your lives!";
  if (pct < 80)    return "The big day is almost in reach!";
  if (pct < 100)   return "Almost ready to say 'I do'! 💍";
  return "You're completely ready to celebrate! 🎉";
}
