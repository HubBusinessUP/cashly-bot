/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7ff',
          100: '#d9edff',
          200: '#bce0ff',
          300: '#8ecbff',
          400: '#59adff',
          500: '#3389ff',
          600: '#1c68f5',
          700: '#1652e1',
          800: '#1943b6',
          900: '#1b3c8f',
          950: '#152559',
        },
      },
    },
  },
  plugins: [],
}
