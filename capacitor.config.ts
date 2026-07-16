import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.menorah.biblequiz",
  appName: "Menorah Bible Quiz",
  webDir: "www",
  server: {
    url: "https://menorah-bible-quiz.vercel.app",
    cleartext: false,
  },
};

export default config;
