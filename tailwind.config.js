/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dribbble: {
          canvas: '#ECECEE',
          card: '#FFFFFF',
          cardAlt: '#F7F7F9',
          border: '#E8E8EC',
          borderDark: '#D4D4D8',
          accent: '#E83D6F',
          accentHover: '#D92A5E',
          accentLight: '#FDF2F4',
          dark: '#121215',
          darkHover: '#1E1E24',
          muted: '#8E8E93',
          textMain: '#1C1C1E',
        },
        skylark: {
          50: '#fdf2f4',
          100: '#fce7ea',
          200: '#f9d2d9',
          300: '#f4adb9',
          400: '#ec7c92',
          500: '#e83d6f',
          600: '#d92a5e',
          700: '#b81d4b',
          800: '#991b40',
          900: '#801b3a',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'soft-card': '0 4px 20px -2px rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
        'app-frame': '0 25px 60px -15px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.8)',
        'float-pill': '0 4px 14px rgba(232, 61, 111, 0.25)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}

