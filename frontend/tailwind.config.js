/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#861657',
          light: '#D56AA0',
          dark: '#5c0f3d',
        },
      },
    },
  },
  plugins: [],
}
