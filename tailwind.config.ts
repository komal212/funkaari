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
        lavender: {
          50: "#F7F4FF",
          100: "#EDE8FF",
          200: "#DDD4FF",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B7FD4",
        },
        mint: {
          50: "#EDFCF7",
          100: "#D4F5E9",
          200: "#A8EDD4",
          300: "#7EEBCC",
          400: "#4ECDC4",
          500: "#2BB8AD",
        },
        peach: {
          50: "#FFF8F3",
          100: "#FFE5D4",
          200: "#FFD0B5",
          300: "#FFB894",
          400: "#FF9A76",
          500: "#F4845F",
        },
        sunny: {
          50: "#FFFCF0",
          100: "#FFF4C2",
          200: "#FFE066",
          300: "#F5D547",
          400: "#E8C030",
        },
        sky: {
          50: "#F0F9FF",
          100: "#D6EEFF",
          200: "#B3DFFF",
          300: "#87CEEB",
          400: "#6BB3F0",
        },
        cream: "#FEFCF8",
        ink: "#2D3142",
        muted: "#6B7280",
      },
      fontFamily: {
        display: ["var(--font-quicksand)", "system-ui", "sans-serif"],
        body: ["var(--font-nunito)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        soft: "0 4px 24px -4px rgba(139, 127, 212, 0.12)",
        card: "0 8px 32px -8px rgba(45, 49, 66, 0.1)",
        "card-hover": "0 16px 48px -12px rgba(139, 127, 212, 0.22)",
        pill: "0 2px 12px -2px rgba(139, 127, 212, 0.15)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite",
        "float-delay": "float 7s ease-in-out 2s infinite",
        wiggle: "wiggle 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
