/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        "slide-up": "slideUp 0.85s ease-in-out",
      },
      //================================
      flexGrow: {
        2: "2",
      },
      width: {
        spineWidth: "var(--rectangle-width)",
        hSpineWidth: "calc(1.4 * var(--rectangle-width))",
      },
    },
  },
  plugins: [],
};
