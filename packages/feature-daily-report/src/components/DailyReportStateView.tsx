import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';
import {buttonStyle, colors, spacing, typography} from '../theme/tokens';

type DailyReportStateViewProps = {
  title: string;
  description: string;
  isLoading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

export function DailyReportStateView({
  title,
  description,
  isLoading = false,
  actionLabel,
  onAction,
}: DailyReportStateViewProps) {
  return (
    <View style={styles.root}>
      {isLoading ? <ActivityIndicator size="large" color={colors.primary} /> : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction ? (
        <Pressable
          style={styles.actionButton}
          onPress={onAction}
          accessibilityRole="button"
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...typography.section,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    textAlign: 'center',
  },
  actionButton: {
    ...buttonStyle,
    marginTop: spacing.xs,
  },
  actionLabel: {
    color: colors.inverseText,
    fontSize: 15,
    fontWeight: '700',
  },
});
