/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#003087',
          50: '#EEF2FB',
          100: '#D4DDF3',
          200: '#A8BBE7',
          300: '#7D99DB',
          400: '#5177CF',
          500: '#2655C3',
          600: '#003087',
          700: '#002670',
          800: '#001D52',
          900: '#001333',
          950: '#000A1A',
        },
        accent: {
          DEFAULT: '#DC2626',
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#DC2626',
          600: '#B91C1C',
          700: '#991B1B',
        },
        ink: {
          DEFAULT: '#0F172A',
          muted: '#334155',
          subtle: '#64748B',
          meta: '#94A3B8',
        },
        line: {
          DEFAULT: '#E2E8F0',
          subtle: '#F1F5F9',
          strong: '#CBD5E1',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#F8FAFC',
          sunk: '#F1F5F9',
        },
        dark: {
          bg:      '#020617',
          surface: '#0B1220',
          card:    '#0F172A',
          elev:    '#131C30',
          border:  '#1E293B',
          hover:   '#1E293B',
          input:   '#0F172A',
          accent:  '#3B82F6',
        },
        success: '#16A34A',
        warn:    '#F59E0B',
        info:    '#0891B2',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.05em' }],
        display: ['clamp(2.5rem, 5vw, 3.75rem)', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
        hero: ['clamp(2rem, 4vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        card: '1rem',
        cardLg: '1.5rem',
        cardXl: '2rem',
        btn: '0.75rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 8px 24px rgba(15, 23, 42, 0.08), 0 24px 56px rgba(0, 48, 135, 0.12)',
        glow: '0 0 0 1px rgba(255, 255, 255, 0.08), 0 20px 60px rgba(2, 6, 23, 0.45)',
        ring: '0 0 0 4px rgba(0, 48, 135, 0.12)',
        'ring-accent': '0 0 0 4px rgba(220, 38, 38, 0.12)',
        inner: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        250: '250ms',
        350: '350ms',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'soft-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-8px) rotate(2deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out forwards',
        'soft-pulse': 'soft-pulse 2.4s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
