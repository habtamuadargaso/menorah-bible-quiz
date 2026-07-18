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
          950: "#080d22",
          900: "#0b1f3a",
          800: "#12294f",
          700: "#1b3763",
        },
        purple: {
          300: "#c9b6ff",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6524b8",
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
      borderRadius: {
        "card-sm": "24px",
        card: "28px",
        "card-lg": "32px",
      },
      boxShadow: {
        gold: "0 0 30px rgba(212,175,55,0.45)",
        "gold-lg": "0 20px 60px rgba(212,175,55,0.25)",
        purple: "0 0 30px rgba(139,92,246,0.45)",
        "purple-lg": "0 20px 60px rgba(139,92,246,0.25)",
        premium: "0 20px 60px rgba(0,0,0,0.32)",
        "premium-lg": "0 28px 90px rgba(0,0,0,0.4)",
      },
      backgroundImage: {
        "glass-gold":
          "linear-gradient(150deg, rgba(232,193,95,0.14) 0%, rgba(255,255,255,0.045) 55%, rgba(255,255,255,0.02) 100%)",
        "glass-purple":
          "linear-gradient(150deg, rgba(139,92,246,0.18) 0%, rgba(255,255,255,0.045) 55%, rgba(255,255,255,0.02) 100%)",
        "glass-neutral":
          "linear-gradient(150deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.03) 100%)",
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
        auroraDrift: {
          "0%, 100%": { transform: "translate3d(-4%, -2%, 0) scale(1)" },
          "50%": { transform: "translate3d(4%, 3%, 0) scale(1.08)" },
        },
      },
      animation: {
        glowPulse: "glowPulse 8s ease-in-out infinite",
        floatSlow: "floatSlow 6s ease-in-out infinite",
        confettiFall: "confettiFall 2.6s linear forwards",
        auroraDrift: "auroraDrift 12s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
