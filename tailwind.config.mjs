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
        "slide-up": "slideUp 0.85s ease-in-out forwards",
      },
      //================================
      flexGrow: {
        2: "2",
      },
      width: {
        spineWidth: "var(--rectangle-width)",
        hSpineWidth: "calc(1.4 * var(--rectangle-width))",
      },
      colors: {
        scrollbar: {
          track: "rgba(0, 0, 0, 0)",
          thumb: "rgba(0, 0, 0, 0.3)",
        },
      },
    },
  },
  plugins: [
    require("tailwind-scrollbar-hide"),
    ({ addUtilities, config }) => {
      const colors = config("theme.colors.scrollbar");

      addUtilities({
        ".scrollbar-styled": {
          "scrollbar-width": "thin",
          "scrollbar-color": `${colors.thumb} ${colors.track}`,

          "&::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: colors.track,
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: colors.thumb,
            borderRadius: "0.5rem",
            border: "2px solid transparent",
            backgroundClip: "content-box",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: colors["thumb-hover"],
          },
        },
      });
    },
  ],
};
