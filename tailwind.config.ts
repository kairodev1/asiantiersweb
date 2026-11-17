import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark charcoal surfaces (text + dark elements) — kept name for compatibility
        navy: {
          950: "#f4f6f9",
          900: "#ffffff",
          850: "#f1f5f9",
          800: "#e8edf3",
          700: "#d9e2ec",
          600: "#b8c4d4",
        },
        // Light blue — subtle primary accent
        brand: {
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
        },
        // Dark green — main brand colour
        mint: {
          300: "#16a34a",
          400: "#15803d",
          500: "#166534",
          600: "#14532d",
        },
        // Dark charcoal text scale (light theme)
        ink: {
          100: "#0f172a",
          200: "#1e293b",
          300: "#334155",
          400: "#475569",
          500: "#64748b",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(15,23,42,0.04) inset, 0 8px 24px -16px rgba(15,23,42,0.18)",
        rise: "0 12px 28px -16px rgba(15,23,42,0.22)",
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