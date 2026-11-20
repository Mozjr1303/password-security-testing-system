/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Archivo', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['Archivo', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', '"Times New Roman"', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
