"use client";

import { forwardRef, InputHTMLAttributes, useState } from "react";
import { motion } from "framer-motion";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs tracking-widest uppercase text-navy/60 font-sans"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`
              w-full px-4 py-3 min-h-[48px]
              bg-white border border-navy/20 text-navy text-sm font-sans
              placeholder:text-navy/30
              outline-none transition-colors duration-200
              ${error ? "border-red-400" : focused ? "border-gold" : ""}
              ${className}
            `}
            {...props}
          />
          {/* Animated gold underline on focus */}
          <motion.div
            className="absolute bottom-0 left-0 h-[2px] bg-gold"
            initial={false}
            animate={{ width: focused && !error ? "100%" : "0%" }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          />
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-500 font-sans"
          >
            {error}
          </motion.p>
        )}
        {hint && !error && (
          <p className="text-xs text-navy/40 font-sans">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
