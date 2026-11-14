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
        display: ['Fraunces', 'Iowan Old Style', 'Palatino Linotype', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'Cambria', 'serif'],
      },
      colors: {
        midnight: {
          950: '#070a13',
          900: '#0b101e',
          850: '#10172a',
          800: '#151f38',
          750: '#1c2949',
          700: '#25365e',
          600: '#344b80',
        },
        parchment: {
          50: '#faf8f5',
          100: '#f4efe6',
          200: '#eae2d3',
          300: '#dcceb9',
        },
        lantern: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        meadow: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        vox: {
          midnight: '#070a13',
          slate: '#131d2e',
          cream: '#faf8f5',
          gold: '#FFCE0B',
          border: 'rgba(255, 255, 255, 0.1)',
          warmBorder: 'rgba(231, 224, 212, 0.9)',
          muted: '#94a3b8',
          lightMuted: '#78716c',
          coral: '#f43f5e',
          mint: '#10b981',
          sidebar: '#090e1a',
        }
      },
      boxShadow: {
        'storybook-sm': '0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
        'storybook': '0 10px 30px -6px rgba(7, 10, 19, 0.25), 0 2px 8px -2px rgba(7, 10, 19, 0.1)',
        'storybook-hover': '0 20px 40px -10px rgba(7, 10, 19, 0.35), 0 4px 12px -2px rgba(7, 10, 19, 0.15)',
        'lantern-glow': '0 0 24px -2px rgba(245, 158, 11, 0.35)',
        'lantern-glow-sm': '0 0 14px -2px rgba(245, 158, 11, 0.25)',
        'gold-glow': '0 0 28px rgba(245, 158, 11, 0.45)',
        'gold-sm': '0 2px 10px rgba(245, 158, 11, 0.35)',
        'cel-border': 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      },
      backgroundImage: {
        'lantern-radial': 'radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.15) 0%, transparent 65%)',
        'storybook-card-dark': 'linear-gradient(180deg, rgba(28, 41, 73, 0.7) 0%, rgba(21, 31, 56, 0.9) 100%)',
        'storybook-card-light': 'linear-gradient(180deg, #ffffff 0%, #faf8f5 100%)',
      }
    },
  },
  plugins: [],
}

