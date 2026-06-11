import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EAF8F2",
          100: "#D4F0E4",
          200: "#A8E1CA",
          300: "#7ED0B0",
          400: "#4FBC94",
          500: "#20A67A",
          600: "#178661",
          700: "#147A5C",
          800: "#0F5E45",
          900: "#0D4A38"
        },
        surface: "#FFFFFF",
        background: "#F7FAF8",
        muted: "#F1F6F3",
        border: "#DDE5E1",
        text: {
          primary: "#17211D",
          secondary: "#5E6B65",
          muted: "#8A9690"
        },
        status: {
          info: "#2563EB",
          warning: "#D97706",
          success: "#15803D",
          danger: "#DC2626",
          neutral: "#64748B"
        }
      },
      boxShadow: {
        soft: "0 8px 24px rgba(23, 33, 29, 0.04)"
      },
      borderRadius: {
        lg: "10px",
        xl: "12px",
        "2xl": "14px",
        "3xl": "18px"
      }
    }
  },
  plugins: [],
};

export default config;
