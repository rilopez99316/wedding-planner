import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "inset" | "flat";
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "",
  sm:   "p-4",
  md:   "p-6",
  lg:   "p-8",
};

export default function Card({
  children,
  className,
  variant = "default",
  padding = "md",
}: CardProps) {
  return (
    <div
      className={cn(
        paddingMap[padding],
        {
          "bg-white rounded-lg shadow-apple-md":               variant === "default",
          "bg-gray-50 rounded-md border border-gray-200":      variant === "inset",
          "bg-white rounded-lg border border-gray-100":        variant === "flat",
        },
        className
      )}
    >
      {children}
    </div>
  );
}
