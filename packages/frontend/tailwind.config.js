/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['Inclusive Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        ui:    ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['ui-serif', 'Georgia', 'Cambria', 'serif'],
        mono:  ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // Brand
        primary: { DEFAULT: '#E8862A', press: '#D97520', soft: '#FFF7ED' },
        // Surfaces (light / dark via NativeWind dark: prefix)
        card:    { DEFAULT: '#FFFFFF',  dark: '#262626' },
        panel:   { DEFAULT: '#F7F4EF', dark: '#1F1F1F' },
        // Text
        content:     { DEFAULT: '#1C1917', dark: '#FAFAFA' },
        contentSoft: { DEFAULT: '#44403C', dark: '#D6D3D1' },
        muted:       { DEFAULT: '#78716C', dark: '#A8A29E' },
        faint:       { DEFAULT: '#A8A29E', dark: '#737373' },
        // Borders
        borderColor: { DEFAULT: '#E7E5E4', dark: '#3A3A3A' },
        // Status
        success: { DEFAULT: '#059669', dark: '#34D399' },
        // Legacy aliases kept for gradual migration
        background:       { DEFAULT: '#F5F5F4', dark: '#1A1A1A' },
        backgroundStrong: { DEFAULT: '#F0EDE8', dark: '#171717' },
        outlineColor:     { DEFAULT: '#D6D3D1', dark: '#525252' },
      },
    },
  },
  plugins: [],
}
