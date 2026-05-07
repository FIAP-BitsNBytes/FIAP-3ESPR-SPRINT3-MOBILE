export const colors = {
  // Surfaces — cinematic deep dark
  background: '#0F172A',
  surface: '#1E293B',
  surfaceHigh: '#334155',
  surfaceCard: 'rgba(255,255,255,0.04)',

  // Brand
  primary: '#F97316',
  primaryGlow: 'rgba(249,115,22,0.18)',
  secondary: '#FB923C',

  // Semantic
  success: '#22C55E',
  successGlow: 'rgba(34,197,94,0.15)',
  danger: '#EF4444',
  warning: '#FBBF24',

  // Text
  text: '#F1F5F9',
  textSecondary: '#CBD5E1',
  muted: '#64748B',

  // Structural
  border: 'rgba(255,255,255,0.08)',
  borderSubtle: 'rgba(255,255,255,0.04)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primary: {
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

export const timing = {
  fast: 150,
  normal: 250,
  slow: 400,
  xpBar: 900,
} as const;
