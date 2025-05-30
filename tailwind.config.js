/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'game-primary': '#FF6B6B',
        'game-secondary': '#4ECDC4',
        'game-accent': '#FFE66D',
        'game-dark': '#2C3E50',
        'game-light': '#F7F9FC',
      },
      fontFamily: {
        'game': ['"Press Start 2P"', 'cursive'],
        'sans': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

