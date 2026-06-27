import type { Config } from "tailwindcss";

// Tailwind v4: theme is configured via @theme in app/globals.css.
// This file is kept for editor tooling compatibility only.
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
