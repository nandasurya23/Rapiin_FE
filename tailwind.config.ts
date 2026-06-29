import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // === BRAND PRIMITIVES (CSS var mapped) ===
        "brand-navy": {
          900: "var(--color-navy-900)",
          800: "var(--color-navy-800)",
          700: "var(--color-navy-700)",
          600: "var(--color-navy-600)",
          500: "var(--color-navy-500)",
          400: "var(--color-navy-400)",
        },
        "brand-gold": {
          600: "var(--color-gold-600)",
          500: "var(--color-gold-500)",
          300: "var(--color-gold-300)",
        },

        // === SEMANTIC TOKENS ===
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        "surface-elevated": "var(--color-surface-elevated)",
        "surface-inset": "var(--color-surface-inset)",

        border: "var(--color-border)",
        "border-strong": "var(--color-border-strong)",

        text: {
          DEFAULT: "var(--color-text)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
          disabled: "var(--color-text-disabled)",
          inverse: "var(--color-text-inverse)",
        },

        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          active: "var(--color-primary-active)",
          surface: "var(--color-primary-surface)",
        },

        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
          surface: "var(--color-accent-surface)",
        },

        // === STATUS ===
        success: {
          DEFAULT: "var(--color-success)",
          surface: "var(--color-success-surface)",
          border: "var(--color-success-border)",
          text: "var(--color-success-text)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          surface: "var(--color-warning-surface)",
          border: "var(--color-warning-border)",
          text: "var(--color-warning-text)",
        },
        danger: {
          DEFAULT: "var(--color-danger)",
          surface: "var(--color-danger-surface)",
          border: "var(--color-danger-border)",
          text: "var(--color-danger-text)",
        },
        info: {
          DEFAULT: "var(--color-info)",
          surface: "var(--color-info-surface)",
          border: "var(--color-info-border)",
          text: "var(--color-info-text)",
        },

        // Legacy aliases for backward compat (to avoid breaking imports)
        brand: {
          50: "var(--color-primary-surface)",
          100: "var(--color-primary-surface)",
          200: "rgba(55, 88, 145, 0.15)",
          300: "rgba(55, 88, 145, 0.25)",
          400: "var(--color-navy-500)",
          500: "var(--color-primary)",
          600: "var(--color-primary-hover)",
          700: "var(--color-primary-hover)",
          800: "var(--color-primary-active)",
          900: "var(--color-navy-900)",
        },
        status: {
          info: "var(--color-info)",
          warning: "var(--color-warning)",
          success: "var(--color-success)",
          danger: "var(--color-danger)",
          neutral: "var(--color-text-muted)",
        },
        muted: "var(--color-surface-elevated)",
      },

      borderRadius: {
        none: "0",
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "24px",
        full: "9999px",
      },

      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-sm)",
        soft: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        modal: "var(--shadow-modal)",
        hover: "var(--shadow-md)",
        none: "none",
      },

      fontFamily: {
        sans: ["Outfit", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },

      fontSize: {
        "2xs": ["10px", { lineHeight: "14px" }],
        xs: ["11px", { lineHeight: "16px" }],
        sm: ["13px", { lineHeight: "20px" }],
        base: ["15px", { lineHeight: "24px" }],
        lg: ["17px", { lineHeight: "26px" }],
        xl: ["20px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["30px", { lineHeight: "38px" }],
        "4xl": ["36px", { lineHeight: "44px" }],
      },

      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "toast-enter": {
          from: { opacity: "0", transform: "translate3d(0, -10px, 0) scale(0.98)" },
          to: { opacity: "1", transform: "translate3d(0, 0, 0) scale(1)" },
        },
      },

      animation: {
        "fade-up": "fade-up 420ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-up-delay-1": "fade-up 420ms cubic-bezier(0.22, 1, 0.36, 1) 80ms both",
        "fade-up-delay-2": "fade-up 420ms cubic-bezier(0.22, 1, 0.36, 1) 160ms both",
        "fade-up-delay-3": "fade-up 420ms cubic-bezier(0.22, 1, 0.36, 1) 240ms both",
        "fade-in": "fade-in 200ms ease-out both",
        "scale-in": "scale-in 200ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-down": "slide-down 200ms cubic-bezier(0.22, 1, 0.36, 1) both",
        shimmer: "shimmer 1.6s linear infinite",
        "toast-enter": "toast-enter 240ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "spin-slow": "spin 2s linear infinite",
      },

      transitionDuration: {
        "120": "120ms",
        "200": "200ms",
        "300": "300ms",
        "400": "400ms",
      },

      transitionTimingFunction: {
        spring: "cubic-bezier(0.22, 1, 0.36, 1)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      spacing: {
        "4.5": "18px",
        "13": "52px",
        "15": "60px",
        "18": "72px",
      },
    },
  },
  plugins: [],
};

export default config;
