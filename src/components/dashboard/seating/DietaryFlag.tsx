import { cn } from "@/lib/utils";

const DIETARY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  VEGETARIAN:  { bg: "bg-green-50",  text: "text-green-700",  label: "Veg" },
  VEGAN:       { bg: "bg-green-100", text: "text-green-800",  label: "Vgn" },
  GLUTEN_FREE: { bg: "bg-amber-50",  text: "text-amber-700",  label: "GF" },
  NUT_ALLERGY: { bg: "bg-red-50",    text: "text-red-700",    label: "Nut" },
  DAIRY_FREE:  { bg: "bg-blue-50",   text: "text-blue-700",   label: "DF" },
  KOSHER:      { bg: "bg-purple-50", text: "text-purple-700", label: "K" },
  HALAL:       { bg: "bg-indigo-50", text: "text-indigo-700", label: "H" },
};

interface DietaryFlagProps {
  restriction: string;
  className?: string;
}

export default function DietaryFlag({ restriction, className }: DietaryFlagProps) {
  const style = DIETARY_COLORS[restriction] ?? {
    bg:    "bg-gray-50",
    text:  "text-gray-600",
    label: restriction.slice(0, 3),
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
        style.bg,
        style.text,
        className
      )}
      title={restriction.replace(/_/g, " ")}
    >
      {style.label}
    </span>
  );
}
