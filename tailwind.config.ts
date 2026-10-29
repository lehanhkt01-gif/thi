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
        admin: {
          red: "#DC2626",
          redDark: "#B91C1C",
          redLight: "#FEE2E2",
          redSoft: "#FEF2F2",
          cobalt: "#0284C7",
          cobaltDark: "#0369A1",
          cobaltLight: "#E0F2FE",
          surface: "#F8FAFC",
          card: "#FFFFFF",
          border: "#E2E8F0",
          borderStrong: "#CBD5E1",
          heading: "#0F172A",
          body: "#334155",
          muted: "#64748B",
          success: "#16A34A",
          successLight: "#DCFCE7",
          warning: "#D97706",
          warningLight: "#FEF3C7",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Segoe UI", "-apple-system", "BlinkMacSystemFont", "Roboto", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)",
        card: "0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)",
        float: "0 10px 25px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -4px rgba(15, 23, 42, 0.05)",
        dialog: "0 20px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.1)",
      },
      animation: {
        "pulse-subtle": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
