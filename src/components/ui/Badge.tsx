import { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-medium text-xs px-2.5 py-0.5",
  {
    variants: {
      variant: {
        default:      "bg-gray-100 text-gray-700",
        accent:       "bg-accent-light text-accent",
        success:      "bg-green-50 text-green-700",
        warning:      "bg-amber-50 text-amber-700",
        danger:       "bg-red-50 text-red-700",
        "coming-soon":"bg-gray-100 text-gray-400 border border-dashed border-gray-300",
        gold:         "bg-amber-50 text-amber-700 border border-amber-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode;
  className?: string;
}

export default function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {children}
    </span>
  );
}
