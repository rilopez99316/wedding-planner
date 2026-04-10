import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/emails/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Apple-inspired neutrals (platform + dashboard) ─────────────
        gray: {
          50:  "#F9F9F9",
          100: "#F2F2F2",
          200: "#E5E5E5",
          300: "#D1D1D1",
          400: "#A1A1A1",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
        },
        // ── Accent (Apple blue default; couples customize via CSS var) ──
        accent: {
          DEFAULT: "#0071E3",
          hover:   "#0077ED",
          light:   "#E8F1FB",
          dark:    "#0058B3",
        },
        // ── Wedding palette (public wedding pages) ──────────────────────
        navy:      "rgb(27 42 74 / <alpha-value>)",
        champagne: "rgb(245 230 200 / <alpha-value>)",
        ivory:     "rgb(253 250 245 / <alpha-value>)",
        gold:      "rgb(201 168 76 / <alpha-value>)",
      },
      fontFamily: {
        sans:  ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      fontSize: {
        // Responsive display sizes
        display:    ["clamp(3rem, 8vw, 6rem)",   { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        "display-sm": ["clamp(2rem, 5vw, 3.5rem)", { lineHeight: "1.1",  letterSpacing: "-0.02em" }],
      },
      boxShadow: {
        // Apple-style subtle shadows
        "apple-xs": "0 1px 2px rgba(0,0,0,0.04)",
        "apple-sm": "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "apple-md": "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
        "apple-lg": "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05)",
        "apple-xl": "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
      },
      borderRadius: {
        DEFAULT: "10px",
        sm:  "6px",
        md:  "10px",
        lg:  "16px",
        xl:  "22px",
        "2xl": "28px",
      },
      letterSpacing: {
        widest: "0.25em",
        wider:  "0.15em",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-8px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in":  "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
