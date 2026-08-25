/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pttc: {
          red: '#c92127',
          darkred: '#9b1419',
          gold: '#eab308',
          blue: '#1e3a8a',
          slate: '#0f172a'
        }
      }
    },
  },
  plugins: [],
};
