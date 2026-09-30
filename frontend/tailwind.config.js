/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#000000",
          surface: "#1c1c1e",
          surface2: "#2c2c2e",
          border: "#3a3a3c",
          indigo: "#0a84ff",
          violet: "#0a84ff",
          cyan: "#64d2ff",
          accent: "#0a84ff",
          success: "#30d158",
          warning: "#ff9f0a",
          danger: "#ff453a",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: "0.8" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        wave: {
          "0%, 100%": { height: "20%" },
          "50%": { height: "100%" },
        },
      },
      animation: {
        pulseRing: "pulseRing 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        wave1: "wave 1.0s ease-in-out infinite",
        wave2: "wave 1.0s ease-in-out 0.15s infinite",
        wave3: "wave 1.0s ease-in-out 0.3s infinite",
        wave4: "wave 1.0s ease-in-out 0.45s infinite",
        wave5: "wave 1.0s ease-in-out 0.6s infinite",
      },
    },
  },
  plugins: [],
};
