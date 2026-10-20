/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vks: {
          burgundy: '#702C3B',
          'burgundy-dark': '#541626',
          'burgundy-hover': '#5C222E',
          'burgundy-active': '#4B1C26',
          'burgundy-container': '#702C3B',
          'burgundy-light': '#F195A5',
          gold: '#D4AE77',
          'gold-dark': '#77592A',
          'gold-hover': '#C29A60',
          'gold-container': '#FFD79D',
          charcoal: '#30252A',
          slate: '#6C5D64',
          canvas: '#FAF6F5',
          surface: '#FFFFFF',
          threadline: '#E8DFDC',
          success: '#1E7B54',
          'success-bg': '#EBF6F1',
          'success-border': '#C1E6D6',
          warning: '#B8741A',
          'warning-bg': '#FDF6EC',
          'warning-border': '#F7DEB8',
          error: '#B82A3A',
          'error-bg': '#FCECEE',
          'error-border': '#F4BEC5',
          draft: '#6C5D64',
          'draft-bg': '#F3EFEF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
      boxShadow: {
        subtle: '0 4px 16px -2px rgba(48, 37, 42, 0.06), 0 2px 6px -1px rgba(48, 37, 42, 0.03)',
        dialog: '0 20px 32px -8px rgba(48, 37, 42, 0.12), 0 8px 12px -4px rgba(48, 37, 42, 0.04)',
      }
    },
  },
  plugins: [],
}
