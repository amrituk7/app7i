module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#2D3B2D",
        secondary: "#3D3229",
        accent: "#9A8A3D",
        neutral: "#FAF8F5",
        dark: "#1F3026",
        moss: "#5C7A5C",
        body: "#5C5347",
        paper: "#FFFDF9",
        line: "#E3DBD0",
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

