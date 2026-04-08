import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy:      "rgb(27 42 74 / <alpha-value>)",
        champagne: "rgb(245 230 200 / <alpha-value>)",
        ivory:     "rgb(253 250 245 / <alpha-value>)",
        gold:      "rgb(201 168 76 / <alpha-value>)",
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans:  ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        display:    ["clamp(3rem, 8vw, 6rem)",   { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-sm": ["clamp(2rem, 5vw, 3.5rem)", { lineHeight: "1.1",  letterSpacing: "-0.01em" }],
      },
      letterSpacing: {
        widest: "0.25em",
        wider:  "0.15em",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
export default config;
