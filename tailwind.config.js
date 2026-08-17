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
        warsgate: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48', // Vivid Red from Logo WARS
          700: '#be123c',
          800: '#9f1239', // Maroon Splash from Logo
          900: '#881337', // Deep Burgundy from Logo
          950: '#4c0519',
        },
        brand: {
          50: '#fef2f2',
          100: '#ffe1e1',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          dark: '#1e0707',
        },
        slate: {
          850: '#131b2e',
          950: '#070a12', // Rich Pitch Dark
        }
      },
      fontFamily: {
        sans: ['Prompt', 'Sarabun', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 25px -5px rgba(225, 29, 72, 0.45)',
        'glow-maroon': '0 0 25px -5px rgba(136, 19, 55, 0.6)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.12)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      }
    },
  },
  plugins: [],
}
