/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF8F0',
          100: '#F7E9D3',
          200: '#E8C9A0',
          300: '#D4A574',
          400: '#B07E4F',
          500: '#8B5E34',
          600: '#6B4423',
          700: '#4A3728',
          800: '#332419',
          900: '#1F140C',
        },
        accent: {
          DEFAULT: '#D4A574',
          dark: '#B07E4F',
        },
      },
      fontFamily: {
        display: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 8px 24px rgba(74, 55, 40, 0.18)',
        chip: '0 2px 6px rgba(74, 55, 40, 0.12)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.2s ease-out',
        'pulse-soft': 'pulse-soft 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
