import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#EB001B",
          dark: "#242124",
          muted: "#65605D",
          beige: "#F7F1E6",
          gold: "#C69B43",
          card: "#F6F6F4"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Arial", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 45px rgba(36, 33, 36, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
