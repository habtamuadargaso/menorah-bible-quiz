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
        // Mission 17.5 — centralized reward/rank/accent tokens so mobile
        // components reference a shared palette (`text-streak-400`,
        // `border-success-500/60`, etc.) instead of scattering new inline
        // hex values. `purple` above already serves as the "violet XP"
        // token — every color used for XP stays purple.* rather than
        // duplicating it here.
        streak: {
          300: "#ffcc94",
          400: "#ff9f5a",
          500: "#f2793a",
        },
        success: {
          300: "#8fe8bd",
          400: "#34d399",
          500: "#16a870",
        },
        coral: {
          300: "#fca5a5",
          400: "#f87171",
          500: "#e0655f",
        },
        silver: {
          300: "#e6eaf2",
          400: "#c7cdd9",
          500: "#9aa4b2",
        },
        bronze: {
          300: "#d9a877",
          400: "#c17f45",
          500: "#a5652f",
        },
        teal: {
          300: "#8fe8dc",
          400: "#2dd4bf",
          500: "#14b8a6",
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
        // Mission 17.5 — matching glow tokens for the new accent colors,
        // same soft-glow shape as gold/purple above (never a hard neon ring).
        teal: "0 0 26px rgba(45,212,191,0.35)",
        streak: "0 0 26px rgba(242,121,58,0.35)",
        success: "0 0 26px rgba(52,211,153,0.35)",
        coral: "0 0 26px rgba(224,101,95,0.3)",
      },
      backgroundImage: {
        "glass-gold":
          "linear-gradient(150deg, rgba(232,193,95,0.14) 0%, rgba(255,255,255,0.045) 55%, rgba(255,255,255,0.02) 100%)",
        "glass-purple":
          "linear-gradient(150deg, rgba(139,92,246,0.18) 0%, rgba(255,255,255,0.045) 55%, rgba(255,255,255,0.02) 100%)",
        "glass-teal":
          "linear-gradient(150deg, rgba(45,212,191,0.16) 0%, rgba(255,255,255,0.045) 55%, rgba(255,255,255,0.02) 100%)",
        "glass-streak":
          "linear-gradient(150deg, rgba(242,121,58,0.16) 0%, rgba(255,255,255,0.045) 55%, rgba(255,255,255,0.02) 100%)",
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
