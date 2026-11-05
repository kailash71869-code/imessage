/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        imessage: {
          blue: '#007AFF',
          bubble: '#E9E9EB',
          bubbleDark: '#26252A',
          green: '#34C759',
        }
      }
    },
  },
  plugins: [],
}
