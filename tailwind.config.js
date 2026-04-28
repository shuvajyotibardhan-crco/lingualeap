/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: '#FFD93D',
          orange: '#FF6B35',
          green:  '#4CAF50',
          blue:   '#2196F3',
          purple: '#9C27B0',
        },
      },
      fontFamily: {
        display: ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

