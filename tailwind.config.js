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
        app: {
          bg: '#080808',
          bgSecondary: '#0D0D0D',
          panel: '#121212',
          panelElevated: '#181818',
          surfaceHover: '#202020',
          text: '#F3F3F3',
          textSecondary: '#A0A0A0',
          textMuted: '#707070',
          borderSubtle: 'rgba(255, 255, 255, 0.09)',
          borderStrong: 'rgba(255, 255, 255, 0.16)',
          greenCompleted: '#15803d',
          greenAccent: '#22c55e',
          nodeDark: '#17171c',
          nodeSelected: '#ffffff',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'folder-glow': '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 20px 0 rgba(255, 255, 255, 0.05)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'node-selected': '0 0 0 2px #ffffff, 0 8px 24px -4px rgba(0, 0, 0, 0.6)',
      }
    },
  },
  plugins: [],
}
