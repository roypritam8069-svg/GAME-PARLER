/** @type {import("tailwindcss").Config} */

const config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
  ],

  theme: {
    extend: {
      // ======================================================
      // COLORS â€” DESIGN.md
      // ======================================================

      colors: {
        "bg-base": "#0A0B0F",
        "bg-surface": "#12141A",
        "bg-elevated": "#181B23",
        "bg-input": "#1A1D26",
        "bg-hover": "#232735",

        "text-primary": "#F5F7FA",
        "text-secondary": "#A6ADBB",
        "text-muted": "#707887",
        "text-disabled": "#4A5162",

        "border-subtle": "#23262F",
        "border-strong": "#2E3340",
        "border-accent": "#7C3AED",

        "accent-primary": "#7C3AED",
        "accent-hover": "#8B5CF6",
        "accent-secondary": "#06B6D4",

        "status-success": "#10B981",
        "status-warning": "#F59E0B",
        "status-danger": "#EF4444",
        "status-info": "#3B82F6",
        "status-pending": "#A855F7",

        "booking-available": "#10B981",
        "booking-booked": "#EF4444",
        "booking-hold": "#F59E0B",
        "booking-closed": "#6B7280",
      },

      // ======================================================
      // SPACING â€” 4px GRID
      // ======================================================

      spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
        "3xl": "48px",
        "4xl": "64px",
        "5xl": "96px",
      },

      // ======================================================
      // TYPOGRAPHY
      // ======================================================

      fontSize: {
        "display-xl": [
          "48px",
          {
            lineHeight: "1.05",
            fontWeight: "700",
            letterSpacing: "-0.02em",
          },
        ],

        "display-lg": [
          "40px",
          {
            lineHeight: "1.10",
            fontWeight: "700",
            letterSpacing: "-0.02em",
          },
        ],

        "heading-1": [
          "32px",
          {
            lineHeight: "1.15",
            fontWeight: "700",
          },
        ],

        "heading-2": [
          "24px",
          {
            lineHeight: "1.20",
            fontWeight: "600",
          },
        ],

        "heading-3": [
          "20px",
          {
            lineHeight: "1.25",
            fontWeight: "600",
          },
        ],

        "heading-4": [
          "18px",
          {
            lineHeight: "1.30",
            fontWeight: "600",
          },
        ],

        "body-lg": [
          "18px",
          {
            lineHeight: "1.50",
            fontWeight: "400",
          },
        ],

        "body-md": [
          "16px",
          {
            lineHeight: "1.50",
            fontWeight: "400",
          },
        ],

        "body-sm": [
          "14px",
          {
            lineHeight: "1.50",
            fontWeight: "400",
          },
        ],

        caption: [
          "12px",
          {
            lineHeight: "1.40",
            fontWeight: "500",
          },
        ],

        overline: [
          "11px",
          {
            lineHeight: "1.40",
            fontWeight: "600",
            letterSpacing: "0.08em",
          },
        ],
      },

      // ======================================================
      // BORDER RADIUS
      // ======================================================

      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "20px",
        full: "9999px",
      },

      // ======================================================
      // SHADOWS
      // ======================================================

      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.4)",
        md: "0 4px 12px rgba(0,0,0,0.5)",
        lg: "0 12px 32px rgba(0,0,0,0.6)",
        glow:
          "0 0 0 1px rgba(124,58,237,0.4), 0 0 24px rgba(124,58,237,0.25)",
      },

      // ======================================================
      // MOTION
      // ======================================================

      transitionDuration: {
        instant: "100ms",
        fast: "150ms",
        normal: "250ms",
        slow: "400ms",
      },

      transitionTimingFunction: {
        standard: "cubic-bezier(0.2, 0, 0, 1)",
        emphasis: "cubic-bezier(0.2, 0, 0, 1.2)",
        exit: "cubic-bezier(0.4, 0, 1, 1)",
      },

      // ======================================================
      // BREAKPOINTS
      // ======================================================

      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },

      // ======================================================
      // MAX WIDTHS
      // ======================================================

      maxWidth: {
        reading: "680px",
        content: "1200px",
        wide: "1440px",
        admin: "1440px",
      },

      // ======================================================
      // Z-INDEX
      // ======================================================

      zIndex: {
        10: "10",
        20: "20",
        30: "30",
        40: "40",
        50: "50",
        60: "60",
        70: "70",
        80: "80",
        90: "90",
      },

      // ======================================================
      // FONT FAMILIES
      // ======================================================

      fontFamily: {
        sans: [
          "var(--font-inter)",
          "var(--font-bengali)",
          "Noto Sans Bengali",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],

        display: [
          "var(--font-inter)",
          "var(--font-bengali)",
          "Noto Sans Bengali",
          "system-ui",
          "sans-serif",
        ],

        mono: [
          "var(--font-jetbrains-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "monospace",
        ],

        bengali: [
          "var(--font-bengali)",
          "Noto Sans Bengali",
          "var(--font-inter)",
          "sans-serif",
        ],
      },
    },
  },

  plugins: [],
};

module.exports = config;
