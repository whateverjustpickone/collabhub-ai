/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors
        primary: {
          DEFAULT: '#3B82F6',
          dark: '#1E40AF',
          light: '#60A5FA',
        },
        secondary: {
          DEFAULT: '#8B5CF6',
          dark: '#6D28D9',
          light: '#A78BFA',
        },
        // Agent Provider Colors
        anthropic: '#D97706',
        openai: '#10B981',
        google: '#3B82F6',
        xai: '#EC4899',
        deepseek: '#8B5CF6',
        perplexity: '#6366F1',
        // VERA Attribution
        vera: '#F59E0B',
        // Status Colors
        available: '#10B981',
        unavailable: '#6B7280',
        error: '#EF4444',
        thinking: '#F59E0B',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
