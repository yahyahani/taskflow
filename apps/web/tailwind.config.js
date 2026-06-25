/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: 'rgb(var(--c-base) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        'surface-hover': 'rgb(var(--c-surface-hover) / <alpha-value>)',
        border: 'rgb(var(--c-border) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',

        violet: {
          DEFAULT: '#7C5CFC',
          soft: '#EDE9FE',
        },
        sky: {
          DEFAULT: '#3B9EFF',
          soft: '#DCEEFF',
        },
        coral: {
          DEFAULT: '#FF6B9D',
          soft: '#FFE3ED',
        },
        mint: {
          DEFAULT: '#22C7A9',
          soft: '#D6F7EF',
        },
        amber: {
          DEFAULT: '#FFA63E',
          soft: '#FFEDD4',
        },

        status: {
          todo: '#8B8FA3',
          progress: '#FFA63E',
          review: '#3B9EFF',
          done: '#22C7A9',
        },
      },
      fontFamily: {
        display: ['var(--font-jakarta)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
      backgroundImage: {
        'mesh-light':
          'radial-gradient(at 10% 10%, rgba(124,92,252,0.55) 0px, transparent 45%), radial-gradient(at 90% 5%, rgba(59,158,255,0.50) 0px, transparent 45%), radial-gradient(at 85% 75%, rgba(255,107,157,0.45) 0px, transparent 45%), radial-gradient(at 10% 85%, rgba(34,199,169,0.45) 0px, transparent 45%), radial-gradient(at 50% 50%, rgba(255,166,62,0.30) 0px, transparent 50%)',
        'mesh-dark':
          'radial-gradient(at 10% 10%, rgba(124,92,252,0.55) 0px, transparent 45%), radial-gradient(at 90% 5%, rgba(59,158,255,0.45) 0px, transparent 45%), radial-gradient(at 85% 75%, rgba(255,107,157,0.40) 0px, transparent 45%), radial-gradient(at 10% 85%, rgba(34,199,169,0.40) 0px, transparent 45%), radial-gradient(at 50% 50%, rgba(255,166,62,0.25) 0px, transparent 50%)',
      },
      boxShadow: {
        glow: '0 8px 30px -4px rgba(124, 92, 252, 0.25)',
        card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)',
        'card-hover': '0 4px 12px rgba(16, 24, 40, 0.08), 0 2px 4px rgba(16, 24, 40, 0.06)',
      },
    },
  },
  plugins: [],
};
