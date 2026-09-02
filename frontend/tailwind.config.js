/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      colors: {
        wa: {
          green: '#00a884',
          'green-dark': '#008069',
          'green-light': '#25d366',
          'dark-bg': 'var(--wa-bg)',
          'dark-panel': 'var(--wa-panel)',
          'dark-header': 'var(--wa-header)',
          'dark-hover': 'var(--wa-hover)',
          'dark-border': 'var(--wa-border)',
          'dark-input': 'var(--wa-input)',
          'dark-bubble-out': 'var(--wa-bubble-out)',
          'dark-bubble-in': 'var(--wa-bubble-in)',
          'blue-tick': '#53bdeb',
          'text-primary': 'var(--wa-text-primary)',
          'text-secondary': 'var(--wa-text-secondary)',
          'text-muted': 'var(--wa-text-muted)',
          'light-bg': '#efeae2',
          'light-panel': '#ffffff',
          'light-header': '#f0f2f5',
          'light-hover': '#f5f6f6',
          'light-border': '#e9edef',
          'light-input': '#f0f2f5',
          'light-bubble-out': '#d9fdd3',
          'light-bubble-in': '#ffffff',
        },
      },
      fontFamily: {
        sans: [
          'Segoe UI',
          'Helvetica Neue',
          'Helvetica',
          'Lucida Grande',
          'Arial',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
