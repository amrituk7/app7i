module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* App7i Brand Colors */
        primary: {
          DEFAULT: "#c46a2d",
          dark: "#8f491d",
          hover: "#efb37a",
          pale: "#f8e6d4",
        },
        accent: {
          DEFAULT: "#2f6b5f",
          pale: "#dfede8",
        },
        /* App7i Palette */
        forest: "#2D3B2D",
        pine: "#1F3026",
        espresso: "#3D3229",
        moss: "#5C7A5C",
        gold: "#9A8A3D",
        slate: "#5C6B80",
        /* Neutrals */
        cream: "#FAF8F5",
        paper: "#FFFDF9",
        soft: "#f6f1ea",
        body: "#5C5347",
        line: {
          DEFAULT: "#E3DBD0",
          strong: "#d8cebf",
        },
        /* Status */
        success: {
          DEFAULT: "#236f56",
          pale: "#e2efe9",
        },
        warning: {
          DEFAULT: "#b96d1e",
          pale: "#fff1df",
        },
        danger: {
          DEFAULT: "#c24b43",
          pale: "#fde8e3",
        },
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        car: "car 8s linear infinite",
        scan: "scan 2s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        car: {
          "0%": { left: "-20%" },
          "100%": { left: "100%" },
        },
        scan: {
          "0%, 100%": { top: "0" },
          "50%": { top: "calc(100% - 4px)" },
        },
      },
    },
  },
  plugins: [],
};

