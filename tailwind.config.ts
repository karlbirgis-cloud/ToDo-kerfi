import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        concrete: "#f4f5f7",
        safety: "#f59e0b",
        blueprint: "#2563eb"
      },
      boxShadow: {
        soft: "0 18px 45px -28px rgba(23, 32, 42, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
