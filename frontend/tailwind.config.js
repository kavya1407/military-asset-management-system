/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tactical: {
          900: '#0b111a',
          800: '#111927',
          700: '#1e293b',
          600: '#334155',
          500: '#475569',
          amber: '#f59e0b',
          emerald: '#10b981',
          blue: '#3b82f6',
          red: '#ef4444'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
