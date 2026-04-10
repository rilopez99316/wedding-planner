"use client";

import { forwardRef, InputHTMLAttributes, useState } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Use "wedding" for the elegant serif-context style */
  variant?: "default" | "wedding";
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, variant = "default", className, id, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const isWedding = variant === "wedding";

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-xs font-medium",
              isWedding
                ? "tracking-widest uppercase text-navy/60 font-sans"
                : "text-gray-600"
            )}
          >
            {label}
          </label>
        )}

        {isWedding ? (
          // Wedding style — border-bottom focus underline
          <div className="relative">
            <input
              ref={ref}
              id={inputId}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className={cn(
                "w-full px-4 py-3 min-h-[48px] bg-white border text-navy text-sm font-sans",
                "placeholder:text-navy/30 outline-none transition-colors duration-200",
                error ? "border-red-400" : focused ? "border-gold" : "border-navy/20",
                className
              )}
              {...props}
            />
            <div
              className="absolute bottom-0 left-0 h-[2px] bg-gold transition-all duration-300"
              style={{ width: focused && !error ? "100%" : "0%" }}
            />
          </div>
        ) : (
          // Apple style — filled background, no border, focus ring
          <input
            ref={ref}
            id={inputId}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={cn(
              "w-full px-4 py-3 min-h-[44px] rounded-md text-[15px] font-sans",
              "bg-gray-100 border-0 text-gray-900 placeholder:text-gray-400",
              "outline-none transition-all duration-150",
              focused ? "bg-white shadow-apple-sm ring-2 ring-accent/25" : "",
              error ? "ring-2 ring-red-400/40 bg-red-50" : "",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              className
            )}
            {...props}
          />
        )}

        {error && (
          <p className="text-xs text-red-500 font-sans mt-0.5">{error}</p>
        )}
        {hint && !error && (
          <p className={cn("text-xs mt-0.5", isWedding ? "text-navy/40 font-sans" : "text-gray-400")}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
