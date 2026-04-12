export const SITE_BRAND = {
  name: 'Ember Esports',
  tagline: 'FORGE YOUR LEGACY',
  logoUrl: '/assets/ember-logo.png',
  colors: {
    crimson: '#CC1A1A',
    flame: '#E63000',
    gold: '#F5A800',
    yellow: '#FFD700',
    steel: '#8A9099',
    bg: '#0D0D0D',
    surface: '#141414',
    surfaceAlt: '#1C1C1C',
    border: '#2A2A2A',
    text: '#FFFFFF',
    muted: '#666666',
  },
  leagues: [
    { id: 'cinder', name: 'Cinder', tier: 1, color: '#FFD700' },
    { id: 'blaze', name: 'Blaze', tier: 2, color: '#F5A800' },
    { id: 'scorch', name: 'Scorch', tier: 3, color: '#E63000' },
    { id: 'magma', name: 'Magma', tier: 4, color: '#CC1A1A' },
  ],
} as const;

export type LeagueId = typeof SITE_BRAND.leagues[number]['id'];
