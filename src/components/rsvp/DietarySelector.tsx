"use client";

import { DietaryKey } from "@/lib/types";

const DIETARY_OPTIONS: { key: DietaryKey; label: string }[] = [
  { key: "nut",        label: "Nut Allergy"  },
  { key: "shellfish",  label: "Shellfish"    },
  { key: "gluten",     label: "Gluten Free"  },
  { key: "dairy",      label: "Dairy Free"   },
  { key: "vegan",      label: "Vegan"        },
  { key: "vegetarian", label: "Vegetarian"   },
  { key: "kosher",     label: "Kosher"       },
  { key: "halal",      label: "Halal"        },
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
    <div className="space-y-5">
      <p className="text-[10px] tracking-[0.28em] uppercase text-navy/50 font-sans">
        Dietary — {guestName}
      </p>

      {/* Pill tags */}
      <div className="flex flex-wrap gap-2">
        {DIETARY_OPTIONS.map(({ key, label }) => {
          const checked = selected.includes(key);
          return (
            <label
              key={key}
              className={[
                "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-sans cursor-pointer",
                "transition-all duration-200 select-none",
                checked
                  ? "border-gold bg-gold text-ivory shadow-apple-xs"
                  : "border-navy/15 bg-white/60 text-navy/60 hover:border-gold/50 hover:text-navy/80",
              ].join(" ")}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(key)}
                className="sr-only"
              />
              {checked && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="shrink-0">
                  <path d="M1 4L3.5 6.5L9 1" stroke="#FDFAF5" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {label}
            </label>
          );
        })}
      </div>

      {/* Notes textarea */}
      <div className="space-y-1.5">
        <label className="text-[10px] tracking-[0.28em] uppercase text-navy/45 font-sans">
          Other Notes
        </label>
        <textarea
          rows={2}
          value={otherNotes}
          onChange={(e) => onChange(selected, e.target.value)}
          placeholder="Any other dietary needs or notes for the kitchen…"
          className="w-full px-4 py-3 rounded-xl border border-navy/10 bg-white/50 text-sm font-sans text-navy placeholder:text-navy/25 outline-none focus:border-gold resize-none transition-colors duration-200"
        />
      </div>
    </div>
  );
}
