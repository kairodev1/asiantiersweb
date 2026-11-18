import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep charcoal / black surfaces
        navy: {
          950: "#050505",
          900: "#0b0b0d",
          850: "#111114",
          800: "#17171b",
          700: "#222228",
          600: "#3a3a42",
        },
        // Red primary accent
        brand: {
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
        },
        // Darker red secondary accent
        mint: {
          300: "#fca5a5",
          400: "#ef4444",
          500: "#dc2626",
          600: "#b91c1c",
        },
        // Light text scale for dark theme
        ink: {
          100: "#fafafa",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
        },
        // Dark borders/surfaces used throughout
        slate: {
          100: "#1f1f23",
          200: "#262626",
          300: "#3f3f46",
          400: "#52525b",
          500: "#71717a",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 32px -16px rgba(0,0,0,0.8)",
        rise: "0 18px 40px -16px rgba(0,0,0,0.9)",
      },
      animation: {
        "fade-up": "fadeUp .5s cubic-bezier(.16,1,.3,1) both",
        "fade-in": "fadeIn .3s ease both",
        "page-in": "pageIn .35s cubic-bezier(.16,1,.3,1) both",
        "pop-in": "popIn .35s cubic-bezier(.16,1,.3,1) both",
        "slide-down": "slideDown .2s ease-out both",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        pageIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        popIn: {
          "0%": { opacity: "0", transform: "scale(.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;