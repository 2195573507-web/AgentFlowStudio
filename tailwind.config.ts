import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/**/*.{ts,tsx,html}', './index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Segoe UI',
          'Microsoft YaHei UI',
          'Microsoft YaHei',
          'PingFang SC',
          'Noto Sans CJK SC',
          'Arial',
          'sans-serif',
        ],
        mono: ['Cascadia Code', 'SFMono-Regular', 'Consolas', 'ui-monospace', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: 'var(--surface)',
          muted: 'var(--surface-muted)',
          hover: 'var(--surface-hover)',
          raised: 'var(--surface-raised)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        accent: {
          50: '#e4f1f6',
          100: '#c9e3ed',
          200: '#9bc9da',
          300: '#68a9c4',
          400: '#3f8baa',
          500: '#256f8f',
          600: '#1d5d78',
          700: '#184a60',
          800: '#143c4f',
          900: '#102f3f',
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          muted: 'var(--accent-muted)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          hover: '#aa3631',
          muted: 'var(--danger-muted)',
        },
        success: {
          DEFAULT: 'var(--success)',
          muted: 'var(--success-muted)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          muted: 'var(--warning-muted)',
        },
        info: {
          DEFAULT: 'var(--info)',
          muted: 'var(--info-muted)',
        },
      },
      boxShadow: {
        tool: 'var(--shadow-sm)',
        'tool-md': 'var(--shadow-md)',
      },
      borderRadius: {
        tool: '6px',
        panel: '8px',
      },
      animation: {
        'fade-in': 'fadeIn 0.16s ease-out',
        'slide-up': 'fadeIn 0.16s ease-out',
        'scale-in': 'fadeIn 0.16s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
