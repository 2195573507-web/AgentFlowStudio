import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/**/*.{ts,tsx,html}', './index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['KaiTi', 'STKaiti', '楷体', 'Kaiti SC', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: 'rgba(255,255,255,0.72)',
          dark: 'rgba(28,28,30,0.82)',
          hover: 'rgba(255,255,255,0.88)',
          'dark-hover': 'rgba(44,44,46,0.92)',
        },
        glass: {
          DEFAULT: 'rgba(255,255,255,0.48)',
          dark: 'rgba(28,28,30,0.56)',
          border: 'rgba(0,0,0,0.06)',
          'dark-border': 'rgba(255,255,255,0.08)',
        },
        accent: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
          muted: 'rgba(59,130,246,0.12)',
        },
        danger: {
          DEFAULT: '#ef4444',
          hover: '#dc2626',
          muted: 'rgba(239,68,68,0.12)',
        },
        success: {
          DEFAULT: '#22c55e',
          muted: 'rgba(34,197,94,0.12)',
        },
        warning: {
          DEFAULT: '#f59e0b',
          muted: 'rgba(245,158,11,0.12)',
        },
      },
      backdropBlur: {
        glass: '20px',
        'glass-heavy': '40px',
      },
      boxShadow: {
        glass: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'glass-lg': '0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'glass-xl': '0 8px 32px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.04)',
        'glass-inner': 'inset 0 1px 2px rgba(255,255,255,0.24)',
      },
      borderRadius: {
        glass: '12px',
        'glass-lg': '16px',
        'glass-xl': '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
