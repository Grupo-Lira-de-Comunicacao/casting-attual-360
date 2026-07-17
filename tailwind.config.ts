import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#071f3a',
        blue: '#0f6fff',
        teal: '#19c7c5',
        gold: '#ffb347',
        cream: '#f8fafc',
      },
      boxShadow: {
        soft: '0 18px 60px -24px rgba(7, 31, 58, 0.25)',
      },
    },
  },
  plugins: [],
} satisfies Config;
