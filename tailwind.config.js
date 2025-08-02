/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        glass: 'rgba(17, 24, 39, 0.6)'
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  plugins: []
};
