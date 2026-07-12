import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#050b1c",
          900: "#0b1f3a",
          800: "#12294f",
          700: "#1b3763",
        },
        gold: {
          300: "#f5d998",
          400: "#f0c868",
          500: "#e8c15f",
          600: "#c99a2e",
          700: "#b8912a",
        },
      },
      fontFamily: {
        display: ["Georgia", "Times New Roman", "serif"],
        body: ["Inter", "Arial", "Helvetica", "sans-serif"],
      },
      boxShadow: {
        gold: "0 0 30px rgba(212,175,55,0.45)",
        "gold-lg": "0 20px 60px rgba(212,175,55,0.25)",
      },
      keyframes: {
        glowPulse: {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.08)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        confettiFall: {
          "0%": { transform: "translateY(-30px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(640px) rotate(360deg)", opacity: "0" },
        },
      },
      animation: {
        glowPulse: "glowPulse 8s ease-in-out infinite",
        floatSlow: "floatSlow 6s ease-in-out infinite",
        confettiFall: "confettiFall 2.6s linear forwards",
      },
    },
  },
  plugins: [],
};

export default config;
