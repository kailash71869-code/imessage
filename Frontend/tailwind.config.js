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
        whatsapp: {
          dark: '#075E54',
          teal: '#128C7E',
          green: '#25D366',
          light: '#DCF8C6',
          chatBg: '#ECE5DD',
          chatBgDark: '#0B141A',
          headerDark: '#1F2C34',
          inputDark: '#2A3942',
          outgoing: '#005C4B',
          incoming: '#202C33',
          blue: '#53BDEB',
        },
        imessage: {
          blue: '#007AFF',
          bubble: '#E9E9EB',
          bubbleDark: '#26252A',
          green: '#34C759',
        }
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-out',
        'slideUp': 'slideUp 0.3s ease-out',
        'slideIn': 'slideIn 0.3s ease-out',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { '0%': { opacity: '0', transform: 'translateX(-20px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
      }
    },
  },
  plugins: [],
}
