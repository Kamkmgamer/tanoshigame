import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx,js,jsx}",
    "./src/app/**/*.{ts,tsx,js,jsx}",
    "./src/components/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        "hamster-brown": "#d6a37e",
        "jalapeno-red": "#d63e2a",
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(-4%)" },
          "50%": { transform: "translateY(4%)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        flower: {
          "0%": { transform: "translateY(-150%) rotate(0deg)" },
          "50%": { transform: "translate(15px, -15%) rotate(15deg)" },
          "100%": { transform: "translateY(120%) rotate(45deg)" },
        }
      },
      animation: {
        wiggle: "wiggle 0.6s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "spin-slow": "spin-slow 8s linear infinite",
        flower: "flower 18s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
