"use client";

import { PALETTES, type PaletteKey, type WeddingPalette } from "@/lib/weddingPalettes";

interface WeddingPalettePickerProps {
  value: string;
  onChange: (key: PaletteKey) => void;
}

function PaletteCard({
  palette,
  selected,
  onClick,
}: {
  palette: WeddingPalette;
  selected: boolean;
  onClick: () => void;
}) {
  const { swatch, name, mood, dark } = palette;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative flex flex-col gap-3 rounded-[14px] p-4 text-left transition-all duration-200",
        "border-2 hover:shadow-apple-md",
        selected
          ? "border-accent shadow-apple-md scale-[1.01]"
          : "border-transparent bg-gray-50 hover:bg-white hover:border-gray-200",
      ].join(" ")}
      style={selected ? { background: "white" } : undefined}
      aria-pressed={selected}
    >
      {/* Swatch strip */}
      <div
        className="w-full h-14 rounded-[8px] overflow-hidden flex"
        style={{ background: swatch.bg }}
      >
        {/* Left block — background color (majority) */}
        <div className="flex-1" style={{ background: swatch.bg }} />

        {/* Colour dots — right-aligned vertical strip */}
        <div
          className="flex flex-col justify-center gap-1.5 pr-3 pl-2"
          style={{ background: swatch.bg }}
        >
          <span
            className="w-4 h-4 rounded-full shadow-sm ring-1 ring-black/5 flex-shrink-0"
            style={{ background: swatch.heading }}
          />
          <span
            className="w-4 h-4 rounded-full shadow-sm ring-1 ring-black/5 flex-shrink-0"
            style={{ background: swatch.accent }}
          />
          <span
            className="w-4 h-4 rounded-full shadow-sm ring-1 ring-black/5 flex-shrink-0"
            style={{ background: swatch.soft }}
          />
        </div>

        {/* Footer colour band */}
        <div
          className="w-5 rounded-r-[8px]"
          style={{ background: swatch.footer }}
        />
      </div>

      {/* Labels */}
      <div className="space-y-0.5 pr-6">
        <p className="text-sm font-semibold text-gray-900 leading-tight">{name}</p>
        <p className="text-[11px] text-gray-400 leading-tight">{mood}</p>
        {dark && (
          <span className="inline-block mt-1 text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full leading-none">
            Dark
          </span>
        )}
      </div>

      {/* Selected checkmark */}
      {selected && (
        <span className="absolute top-3 right-3 w-5 h-5 bg-accent rounded-full flex items-center justify-center shadow-sm">
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
    </button>
  );
}

export default function WeddingPalettePicker({ value, onChange }: WeddingPalettePickerProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PALETTES.map((palette) => (
          <PaletteCard
            key={palette.key}
            palette={palette}
            selected={value === palette.key}
            onClick={() => onChange(palette.key)}
          />
        ))}
      </div>
      <p className="text-[11px] text-gray-400">
        Your chosen palette is applied across your entire wedding website — backgrounds, headings, accents, and footer.
      </p>
    </div>
  );
}
