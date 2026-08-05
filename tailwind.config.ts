import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette values matching exact user image swatch
        brand: {
          50: '#fff5f5',
          100: '#ffe3e3',
          200: '#ffc9c9',
          300: '#ffa88b', // Warm Peach Sunset Coral (#FFA88B)
          400: '#f87171',
          500: '#e63946',
          600: '#d62828', // Primary Crimson Red (#D62828)
          700: '#b91c1c',
          800: '#991b1b',
          900: '#5c1d24', // Velvet Wine Maroon (#5C1D24)
          peach: '#ffa88b',
          maroon: '#5c1d24',
          crimson: '#d62828',
        },
        dark: {
          bg: '#141a29',      // Deep Midnight Navy (#141A29)
          surface: '#222d42', // Dark Slate Navy Surface (#222D42)
          card: '#222d42',    // Card Background (#222D42)
          border: '#3e4a5e',  // Steel Slate Navy Border (#3E4A5E)
          hover: '#2a3750',   // Hover state
        },
        light: {
          bg: '#f8fafc',
          surface: '#ffffff',
          border: '#e2e8f0',
          hover: '#f1f5f9',
        },
      },
      fontFamily: {
        display: ['var(--font-sora)', 'Plus Jakarta Sans', 'sans-serif'],
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        mono: ['var(--font-ibm-plex-mono)', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'glow': '0 0 25px -5px rgba(214, 40, 40, 0.35)',
        'glow-peach': '0 0 25px -5px rgba(255, 168, 139, 0.4)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 3s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
