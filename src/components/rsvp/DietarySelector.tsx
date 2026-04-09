"use client";

import { DietaryKey } from "@/lib/types";

const DIETARY_OPTIONS: { key: DietaryKey; label: string }[] = [
  { key: "nut", label: "Nut Allergy" },
  { key: "shellfish", label: "Shellfish" },
  { key: "gluten", label: "Gluten Free" },
  { key: "dairy", label: "Dairy Free" },
  { key: "vegan", label: "Vegan" },
  { key: "vegetarian", label: "Vegetarian" },
  { key: "kosher", label: "Kosher" },
  { key: "halal", label: "Halal" },
];

interface DietarySelectorProps {
  guestName: string;
  selected: DietaryKey[];
  otherNotes: string;
  onChange: (selected: DietaryKey[], otherNotes: string) => void;
}

export default function DietarySelector({
  guestName,
  selected,
  otherNotes,
  onChange,
}: DietarySelectorProps) {
  function toggle(key: DietaryKey) {
    const next = selected.includes(key)
      ? selected.filter((k) => k !== key)
      : [...selected, key];
    onChange(next, otherNotes);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs tracking-widest uppercase text-navy/50 font-sans">
        Dietary — {guestName}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {DIETARY_OPTIONS.map(({ key, label }) => {
          const checked = selected.includes(key);
          return (
            <label
              key={key}
              className={`flex items-center gap-3 p-3 border cursor-pointer transition-all duration-150 select-none ${
                checked
                  ? "border-gold bg-champagne/30 text-navy"
                  : "border-navy/10 bg-white/50 text-navy/60 hover:border-gold/50"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(key)}
                className="sr-only"
              />
              {/* Custom checkbox */}
              <span
                className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${
                  checked ? "border-gold bg-gold" : "border-navy/20"
                }`}
              >
                {checked && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#FDFAF5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="text-sm font-sans">{label}</span>
            </label>
          );
        })}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs tracking-widest uppercase text-navy/50 font-sans">
          Other Notes
        </label>
        <textarea
          rows={2}
          value={otherNotes}
          onChange={(e) => onChange(selected, e.target.value)}
          placeholder="Any other dietary needs or notes for the kitchen…"
          className="w-full px-4 py-3 border border-navy/10 bg-white/50 text-sm font-sans text-navy placeholder:text-navy/25 outline-none focus:border-gold resize-none transition-colors duration-200"
        />
      </div>
    </div>
  );
}
