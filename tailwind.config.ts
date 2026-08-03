import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#1D4ED8', // Primary
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        ink: {
          DEFAULT: '#0B1B33',
          muted: '#475569',
          light: '#64748B',
        },
        surface: {
          DEFAULT: '#F5F8FC',
          card: '#FFFFFF',
          sidebar: '#0B1B33',
          hover: '#EBF2FA',
        },
        border: {
          DEFAULT: '#DCE6F5',
          subtle: '#E2E8F0',
        }
      },
      fontFamily: {
        display: ['var(--font-sora)', 'sans-serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-ibm-plex-mono)', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(11, 27, 51, 0.05)',
        'float': '0 12px 32px -4px rgba(11, 27, 51, 0.12)',
        'paper': '0 2px 8px 0 rgba(11, 27, 51, 0.08), 0 0 0 1px rgba(220, 230, 245, 0.6)',
      }
    },
  },
  plugins: [],
};
export default config;
