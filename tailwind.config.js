/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'emerald-glow': '#10b981',
      },
      keyframes: {
        'red-flash': {
          '0%, 100%': {
            boxShadow: '0 0 0 rgba(239, 68, 68, 0)',
            borderColor: 'rgba(239, 68, 68, 0.2)',
          },
          '50%': {
            boxShadow: '0 0 25px rgba(239, 68, 68, 0.8), inset 0 0 15px rgba(239, 68, 68, 0.6)',
            borderColor: 'rgba(239, 68, 68, 1)',
          },
        },
        'emerald-glow': {
          '0%, 100%': {
            boxShadow: '0 0 5px rgba(16, 185, 129, 0.4)',
            borderColor: 'rgba(16, 185, 129, 0.6)',
          },
          '50%': {
            boxShadow: '0 0 15px 4px rgba(16, 185, 129, 0.9)',
            borderColor: 'rgba(16, 185, 129, 1)',
          },
        },
      },
      animation: {
        'red-flash': 'red-flash 0.8s ease-in-out infinite',
        'emerald-glow': 'emerald-glow 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
