/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        readora: {
          purple: "#652469",
          royal: "#8f5397",
          plum: "#32102F",
          gold: "#C99A3D",
          goldLight: "#E5C978",
          lavender: "#8f65ad",
          lavenderLight: "#ca97e6",
          cream: "#f1e4bf",
          ivory: "#f0db97",
          cocoa: "#4A2D2A",
          brown: "#6B4639",
          rose: "#A56A7A",
        },
      },

      fontFamily: {
        display: [
          "Literata",
          "Times New Roman",
          "serif",
        ],

        body: [
          "Inter",
          "Arial",
          "sans-serif",
        ],
      },

      boxShadow: {
        magical:
          "0 12px 35px rgba(75, 23, 79, 0.14)",

        gold:
          "0 8px 25px rgba(201, 154, 61, 0.22)",
      },

      keyframes: {
        float: {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-8px)",
          },
        },

        shimmer: {
          "0%": {
            backgroundPosition: "-500px 0",
          },
          "100%": {
            backgroundPosition: "500px 0",
          },
        },

        fadeUp: {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },

        twinkle: {
          "0%, 100%": {
            opacity: "0.35",
            transform: "scale(1)",
          },
          "50%": {
            opacity: "1",
            transform: "scale(1.25)",
          },
        },
      },

      animation: {
        float: "float 5s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        fadeUp: "fadeUp 0.6s ease-out forwards",
        twinkle: "twinkle 2s ease-in-out infinite",
      },
    },
  },

  plugins: [],
};