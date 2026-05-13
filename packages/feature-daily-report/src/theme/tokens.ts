export const colors = {
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceMuted: '#ecfdf5',
  primary: '#047857',
  primarySoft: '#d1fae5',
  primaryText: '#065f46',
  warningSurface: '#fef3c7',
  warningText: '#92400e',
  border: '#e5e7eb',
  text: '#111827',
  textMuted: '#4b5563',
  textSubtle: '#6b7280',
  inverseText: '#ffffff',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 40,
} as const;

export const radius = {
  sm: 10,
  md: 12,
  lg: 16,
  xl: 18,
  pill: 999,
} as const;

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: colors.text,
  },
  section: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
  },
  caption: {
    fontSize: 13,
    color: colors.textSubtle,
  },
} as const;

export const cardStyle = {
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.surface,
  padding: spacing.lg,
} as const;

export const buttonStyle = {
  minHeight: 48,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  borderRadius: radius.md,
  backgroundColor: colors.primary,
  paddingHorizontal: spacing.xl,
};
