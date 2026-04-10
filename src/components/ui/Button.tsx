"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base styles — Apple aesthetic
  "inline-flex items-center justify-center gap-2 font-medium text-[15px] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none",
  {
    variants: {
      variant: {
        primary:   "bg-accent text-white rounded-md hover:brightness-105 shadow-apple-sm",
        secondary: "bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200",
        ghost:     "bg-transparent text-gray-700 rounded-md hover:bg-gray-100",
        danger:    "bg-red-500 text-white rounded-md hover:brightness-105 shadow-apple-sm",
        outline:   "bg-transparent text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50",
        // Wedding page variants (elegant, serif context)
        wedding:   "bg-navy text-champagne border border-navy rounded-none tracking-widest uppercase text-xs hover:brightness-110",
        "wedding-ghost": "bg-transparent text-navy border border-navy/30 rounded-none tracking-widest uppercase text-xs hover:bg-navy/5",
      },
      size: {
        sm:   "px-3 py-1.5 text-[13px]",
        md:   "px-5 py-2.5 min-h-[40px]",
        lg:   "px-7 py-3.5 min-h-[48px] text-[16px]",
        icon: "w-9 h-9 rounded-md p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size:    "md",
    },
  }
);

interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "children">,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  children: ReactNode;
}

export default function Button({
  variant,
  size,
  loading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading && (
        <svg
          className="w-4 h-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </motion.button>
  );
}
