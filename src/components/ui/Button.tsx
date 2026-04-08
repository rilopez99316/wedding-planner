"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  loading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-navy text-champagne border border-navy hover:brightness-110",
  secondary:
    "bg-champagne text-navy border border-champagne hover:brightness-95",
  ghost:
    "bg-transparent text-navy border border-navy hover:bg-navy/5",
};

export default function Button({
  variant = "primary",
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        min-h-[48px] px-8 py-3
        text-sm tracking-widest uppercase font-sans
        rounded-none transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${className}
      `}
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
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </motion.button>
  );
}
