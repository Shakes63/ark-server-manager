import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ark: {
          bg: "#0b0f14",
          panel: "#141b24",
          border: "#1f2a37",
          accent: "#22c55e",
          accent2: "#0ea5e9",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
