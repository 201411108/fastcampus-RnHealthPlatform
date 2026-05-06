export const colors = {
  background: '#ffffff',
  surface: '#f9fafb',
  surfaceElevated: '#ffffff',
  textPrimary: '#111827',
  textSecondary: '#4b5563',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  primary: '#059669',
  primaryMuted: '#d1fae5',
  danger: '#dc2626',
  overlay: 'rgba(17, 24, 39, 0.45)',
  inverseOnDark: '#f9fafb',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
};

export const typography = {
  titleLarge: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  section: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
};
