import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    borderRadius: {
      none: "0px",
      DEFAULT: "0px",
      full: "9999px", // Reserved strictly for 6x6px status dots
    },
    extend: {
      colors: {
        ink: "#0A0A0A",
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F5F4F0",
        },
        charcoal: "#292929",
        muted: "#6E6E6A",
        border: {
          DEFAULT: "#E2E1DC",
          strong: "#0A0A0A",
        },
        campaign: {
          red: "#E52323",
        },
        status: {
          success: "#166534",
          warning: "#B45309",
          danger: "#E52323",
        },
      },
      fontFamily: {
        display: ["var(--font-archivo)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      maxWidth: {
        storefront: "1600px",
        checkout: "1200px",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.22, 1, 0.36, 1)",
        card: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      },
    },
  },
  plugins: [],
};

export default config;

