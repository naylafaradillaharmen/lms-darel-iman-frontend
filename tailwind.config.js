/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dei: {
          emerald: '#0E5C44',
          'emerald-dark': '#0A4533',
          'emerald-light': '#E5F0EA',
          'emerald-neon': '#3DB88C',
          gold: '#A9822B',
          'gold-light': '#FFF6DC',
          'gold-dark': '#6B5310',
          bg: '#F7F8F5',
          surface: '#ffffff',
          ink: '#16251F',
          muted: '#55645D',
          line: '#DDE3DD',
          'dark-bg': '#0E1613',
          'dark-surface': '#15211C',
          'dark-line': '#263630',
          'dark-ink': '#EAF1ED',
          'dark-muted': '#9DB0A7',
        }
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', '"Inter"', 'sans-serif'],
        arabic: ['"Amiri"', 'serif'],
      }
    },
  },
  plugins: [],
}
