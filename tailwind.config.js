/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        "n-bg": "var(--bg-body)",
        "n-card": "var(--bg-card)",
        "n-text": "var(--text-main)",
        "n-muted": "var(--text-muted)",
        "n-border": "var(--border-main)",
        "n-yellow": "var(--brand-yellow)",
        "n-blue": "var(--brand-blue)",
        "n-green": "var(--brand-green)",
        "n-red": "var(--brand-red)",
        "n-inv-bg": "var(--inv-bg)",
        "n-inv-text": "var(--inv-text)",
        "n-on": "var(--on-color)",
      },
    },
  },
  plugins: [],
};
