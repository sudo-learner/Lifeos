/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: '#F7F7F5',
          dark: '#0B0D12'
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#14171F'
        },
        surface2: {
          DEFAULT: '#F0F0ED',
          dark: '#1B1F2A'
        },
        border: {
          DEFAULT: '#E5E5E1',
          dark: '#252A36'
        },
        ink: {
          DEFAULT: '#14151A',
          dark: '#E7E9EE'
        },
        muted: {
          DEFAULT: '#6B6F76',
          dark: '#8A8F9C'
        },
        violet: {
          DEFAULT: '#7C5CFC',
          soft: '#A78BFA'
        },
        teal: {
          DEFAULT: '#22D3C8',
          soft: '#5EEAD4'
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      backgroundImage: {
        aurora: 'linear-gradient(135deg, #7C5CFC 0%, #22D3C8 100%)',
        'aurora-soft': 'linear-gradient(135deg, rgba(124,92,252,0.15) 0%, rgba(34,211,200,0.15) 100%)'
      },
      borderRadius: {
        xl2: '1.25rem'
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -8px rgba(0,0,0,0.08)',
        'card-dark': '0 1px 2px rgba(0,0,0,0.3), 0 8px 24px -8px rgba(0,0,0,0.6)'
      }
    },
  },
  plugins: [],
}
