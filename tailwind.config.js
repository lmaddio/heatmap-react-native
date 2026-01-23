/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Speed quality colors
        'speed-excellent': '#00c800',
        'speed-good': '#7cfc00',
        'speed-fair': '#ffff00',
        'speed-poor': '#ffa500',
        'speed-very-poor': '#ff0000',
        'speed-no-signal': '#8b0000',
        // App specific colors
        'primary': '#007AFF',
        'success': '#34C759',
        'danger': '#FF3B30',
        'warning': '#FF9500',
        'demo': '#4caf50',
        'panel-bg': '#1a1a2e',
        'panel-border': '#4a4a6a',
      },
      spacing: {
        '4.5': '1.125rem',
        '18': '4.5rem',
      },
      borderRadius: {
        'xl': '12px',
      },
    },
  },
  plugins: [],
}

