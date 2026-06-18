import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", lg: "2rem" },
      screens: { "2xl": "1200px" },
    },
    extend: {
      colors: {
        // Colores oficiales del C.D. Berriz (muestreados del escudo)
        rojo: {
          50: "#FEF2F2",
          100: "#FDE0E1",
          200: "#FAC1C4",
          300: "#F58E94",
          400: "#EE5159",
          500: "#E1101A",
          600: "#C50D16",
          700: "#A30B12",
          800: "#850C12",
          900: "#6E0F13",
          DEFAULT: "#E1101A",
        },
        azul: {
          50: "#EAF3FB",
          100: "#CFE3F4",
          200: "#9FC6E8",
          300: "#66A4D8",
          400: "#2F7FC2",
          500: "#0A63A6",
          600: "#00528F",
          700: "#014577",
          800: "#06395F",
          900: "#0A2F4D",
          DEFAULT: "#00528F",
        },
        dorado: {
          50: "#FEF8EC",
          100: "#FCEFD0",
          200: "#F8DD9F",
          300: "#F4C870",
          400: "#F0B050",
          500: "#E69A2E",
          600: "#CA7E20",
          700: "#A2611C",
          800: "#844E1D",
          900: "#6F421C",
          DEFAULT: "#F0B050",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
