import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ParkRanger brand palette
        canopy:    "#2D5A27",  // forest green — primary
        leaf:      "#5A8F3C",  // mid green — secondary
        meadow:    "#A8C97F",  // sage — accents, borders
        sun:       "#E8A020",  // amber — CTA, highlights
        bark:      "#3B2A1A",  // warm brown — text, dark BG
        soil:      "#1C1610",  // near-black — footer, headers
        sky:       "#D4EAF7",  // light blue — info cards
        parchment: "#F7F3EC",  // off-white — page background
        // Semantic aliases
        background: "#F7F3EC",
        foreground:  "#3B2A1A",
      },
      fontFamily: {
        display: ["Cambria", "Georgia", "serif"],
        body:    ["Inter", "Calibri", "system-ui", "sans-serif"],
        mono:    ["Courier New", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        "park": "0 2px 12px 0 rgba(59,42,26,0.10)",
        "park-lg": "0 4px 24px 0 rgba(59,42,26,0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
