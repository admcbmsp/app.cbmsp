/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    borderRadius: {
      sm: '0.125rem',
      md: '0.25rem',
      full: '9999px',
    },
    extend: {
      colors: {
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        surface: 'var(--color-surface)',
        card: 'var(--color-surface)',
        'surface-muted': 'var(--color-surface-muted)',
        border: 'var(--color-border)',
        line: 'var(--color-border)',
        muted: 'var(--color-surface-muted)',
        'muted-foreground': 'var(--color-muted)',
        primary: 'var(--color-primary)',
        'primary-strong': 'var(--color-primary-strong)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        'error-soft': 'var(--color-error-soft)',
        hover: 'var(--color-hover)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        body: ['0.875rem', { lineHeight: '1.25rem' }],
        label: ['0.75rem', { lineHeight: '1rem' }],
      },
    },
  },
  plugins: [],
};
