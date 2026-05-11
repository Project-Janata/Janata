const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    // Only scan local directories - do NOT scan node_modules or parent directories
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inclusive Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['ui-serif', 'Georgia', 'Cambria', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: colors.orange[600],
          press: colors.orange[700],
        },
        background: {
          DEFAULT: colors.white,
          light: colors.neutral[300],
          dark: colors.neutral[900],
        },
        backgroundStrong: {
          DEFAULT: colors.gray[900],
          light: colors.neutral[100],
          dark: colors.neutral[800],
        },
        content: {
          DEFAULT: colors.gray[900],
          light: colors.gray[700],
          dark: colors.gray[100],
        },
        contentStrong: {
          DEFAULT: colors.gray[600],
          light: colors.gray[500],
          dark: colors.gray[400],
        },
        muted: {
          DEFAULT: colors.neutral[200],
          light: colors.neutral[200],
          dark: colors.neutral[600],
        },
        outlineColor: {
          DEFAULT: colors.gray[700],
          dark: colors.gray[300],
        },
        borderColor: {
          DEFAULT: colors.gray[200],
          dark: colors.neutral[700],
        },
        card: {
          DEFAULT: colors.white,
          dark: colors.neutral[800],
        },
      },
    },
  },
  plugins: [],
}
