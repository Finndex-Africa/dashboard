const { PRIMARY_BLUE } = require('./src/config/colors.js');

module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: PRIMARY_BLUE,
          50: '#e6e6ff',
          100: '#b3b3ff',
          200: '#8080ff',
          300: '#4d4dff',
          400: '#1a1aff',
          500: PRIMARY_BLUE,
          600: '#0000e6',
          700: '#0000cc',
          800: '#0000b3',
          900: '#000099',
        },
        blue: {
          50: '#e6e6ff',
          100: '#b3b3ff',
          200: '#8080ff',
          300: '#4d4dff',
          400: '#1a1aff',
          500: PRIMARY_BLUE,
          600: PRIMARY_BLUE,
          700: '#0000e6',
          800: '#0000cc',
          900: '#0000b3',
          950: '#000099',
        },
      },
      fontFamily: {
        body: ['var(--font-whitney-medium)', 'sans-serif'],
        heading: ['var(--font-whitney-bold)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}