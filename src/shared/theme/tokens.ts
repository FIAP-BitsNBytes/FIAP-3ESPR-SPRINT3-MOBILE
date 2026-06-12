export const colors = {
  // Surfaces - accessible clinical light system
  background: '#ECFEFF',
  surface: '#FFFFFF',
  surfaceHigh: '#DFF7FA',
  surfaceCard: 'rgba(255,255,255,0.82)',

  // Brand
  primary: '#0891B2',
  primaryGlow: 'rgba(8,145,178,0.14)',
  secondary: '#0E7490',
  onPrimary: '#FFFFFF',

  // Semantic
  success: '#059669',
  successGlow: 'rgba(5,150,105,0.12)',
  danger: '#DC2626',
  warning: '#B45309',
  info: '#2563EB',
  water: '#0284C7',
  waterAccent: '#38BDF8',

  // Text
  text: '#164E63',
  textSecondary: '#155E75',
  muted: '#64748B',

  // Structural
  border: '#BAE6FD',
  borderSubtle: '#CFFAFE',
} as const;

export const palette = {
  // Cross-feature accents
  amber: '#F59E0B',
  emerald: '#10B981',
  blue: '#3B82F6',
  violet: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
  slate: '#6B7280',
  silver: '#94A3B8',
  bronze: '#CD7C2F',
  pulse: '#4ADE80',
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
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  primary: {
    shadowColor: '#0891B2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 5,
  },
} as const;

export const timing = {
  fast: 150,
  normal: 250,
  slow: 400,
  xpBar: 900,
} as const;
