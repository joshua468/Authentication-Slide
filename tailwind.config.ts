import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          active: "var(--color-primary-active)",
          foreground: "var(--color-on-primary)",
          container: "var(--color-primary-container)",
          "on-container": "var(--color-on-primary-container)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-on-secondary)",
          container: "var(--color-secondary-container)",
          "on-container": "var(--color-on-secondary-container)",
        },
        error: {
          DEFAULT: "var(--color-error)",
          foreground: "var(--color-on-error)",
          container: "var(--color-error-container)",
          "on-container": "var(--color-on-error-container)",
        },
        success: {
          DEFAULT: "var(--color-success)",
          foreground: "var(--color-on-success)",
          container: "var(--color-success-container)",
        },
        surface: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        input: {
          border: "var(--color-input-border)",
          focus: "var(--color-input-focus)",
          text: "var(--color-input-text)",
          bg: "var(--color-input-bg)",
        },
      },
      fontFamily: {
        primary: ["var(--font-family-primary)", "sans-serif"],
        heading: ["var(--font-family-heading)", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        card: "0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 20px 25px -5px rgba(0, 0, 0, 0.02)",
        glow: "0 0 25px -5px rgba(16, 185, 129, 0.35)",
        "glow-lg": "0 0 40px -5px rgba(16, 185, 129, 0.45)",
        soft: "0 4px 20px -2px rgba(15, 23, 42, 0.08)",
        medium: "0 8px 30px -4px rgba(15, 23, 42, 0.12)",
        hard: "0 20px 40px -8px rgba(15, 23, 42, 0.2)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
        shimmer: "shimmer 2s infinite",
      },
    },
  },
  plugins: [],
};

export default config;