/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      flexGrow: {
        2: "2",
      },
	  width: {
		'spineWidth': 'var(--rectangle-width)',
		'hSpineWidth': 'calc(2 * var(--rectangle-width))',
	  },
    },
  },
  plugins: [],
};