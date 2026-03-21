/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          400: '#FB923C',
          500: '#FA7A35',
          600: '#EA580C',
          700: '#C2410C',
        },
      },
      fontFamily: {
        sans: ['Microsoft JhengHei UI', 'Noto Sans TC', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
