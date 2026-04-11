import type { Config } from 'tailwindcss';
import { BRAND } from './src/constants/brand';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:         BRAND.colors.primary,
        secondary:       BRAND.colors.secondary,
        'draft-bg':      BRAND.colors.bg,
        'draft-surface': BRAND.colors.surface,
        'draft-border':  BRAND.colors.border,
        'blue-side':     BRAND.colors.blueSide,
        'red-side':      BRAND.colors.redSide,
        'gold':          BRAND.colors.gold,
        'fearless':      BRAND.colors.fearless,
        'fearless-text': '#FCA5A5',
        'muted':         BRAND.colors.muted,
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        mono:    ['Space Mono', 'monospace'],
        body:    ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
