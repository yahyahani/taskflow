/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#16181D',
        panel: '#1E2128',
        'panel-hover': '#262A33',
        border: '#2C303A',
        ink: '#E8E9ED',
        muted: '#8B8F99',
        accent: '#5B8DEF',
        status: {
          todo: '#6B7280',
          progress: '#D4A24C',
          review: '#5B8DEF',
          done: '#4ABE8C',
        },
      },
      fontFamily: {
        display: ['var(--font-grotesk)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};
