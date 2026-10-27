/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        dentoblue: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36abf7',
          500: '#0c8fe9',
          600: '#0272c7',
          700: '#035ba1',
          800: '#074e85',
          900: '#0c416e',
        },
        tooth: {
          enamel: '#fbfcf9',
          border: '#334155',
          decay: '#dc2626',
          composite: '#38bdf8',
          amalgam: '#64748b',
          gold: '#eab308',
          crown: '#f59e0b',
          rct: '#ef4444',
          implant: '#475569',
          veneer: '#10b981',
          missing: '#94a3b8'
        }
      }
    },
  },
  plugins: [],
}
