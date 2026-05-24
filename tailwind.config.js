/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'charcoal': { 900: '#0b0f12' },
        'slate': { 700: '#3f4550' },
        'emerald': { neon: '#10b981' },
      },
    },
  },
  plugins: [],
};
