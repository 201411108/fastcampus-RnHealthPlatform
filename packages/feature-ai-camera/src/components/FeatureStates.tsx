import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';

export function LoadingStateFullScreen({ message }: { message?: string }) {
  return (
    <View style={styles.loadingRoot} accessibilityLabel="로딩 중">
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? (
        <Text style={[typography.body, styles.loadingMessage]}>{message}</Text>
      ) : null}
    </View>
  );
}

export function EmptyRecordsState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.emptyRoot}>
      <Text style={[typography.section, styles.emptyTitle]}>{title}</Text>
      <Text style={[typography.body, styles.emptyDescription]}>
        {description}
      </Text>
    </View>
  );
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.errorBanner}>
      <Text style={[typography.caption, styles.errorText]}>{message}</Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          style={styles.retryBtn}
        >
          <Text style={styles.retryLabel}>다시 시도</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function PermissionDeniedState({
  title,
  description,
  onOpenSettings,
  onRetryRequest,
}: {
  title: string;
  description: string;
  onOpenSettings: () => void;
  onRetryRequest?: () => void;
}) {
  return (
    <View style={styles.permissionRoot}>
      <Text style={[typography.section, styles.permissionTitle]}>{title}</Text>
      <Text style={[typography.body, styles.permissionBody]}>{description}</Text>
      <Pressable
        style={[styles.primaryButton, styles.permissionBtn]}
        onPress={onOpenSettings}
        accessibilityRole="button"
      >
        <Text style={styles.primaryButtonLabel}>설정 열기</Text>
      </Pressable>
      {onRetryRequest ? (
        <Pressable
          style={styles.secondaryPress}
          onPress={onRetryRequest}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryLabel}>권한 다시 요청</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function AnalyzingOverlay({ visible }: { visible: boolean }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlayBackdrop}>
        <View style={styles.overlayCard}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[typography.body, styles.overlayText]}>
            이미지를 분석하는 중입니다…
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.md,
    padding: spacing.xl,
  },
  loadingMessage: {
    textAlign: 'center',
  },
  emptyRoot: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
    maxWidth: 280,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#fef2f2',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    flex: 1,
    color: colors.danger,
  },
  retryBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  retryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  permissionRoot: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  permissionTitle: {
    color: colors.inverseOnDark,
    textAlign: 'center',
  },
  permissionBody: {
    color: colors.inverseOnDark,
    opacity: 0.85,
    textAlign: 'center',
  },
  permissionBtn: {
    marginTop: spacing.sm,
    minWidth: 200,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primaryButtonLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryPress: {
    padding: spacing.sm,
  },
  secondaryLabel: {
    fontSize: 15,
    color: colors.inverseOnDark,
    textDecorationLine: 'underline',
  },
  overlayBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  overlayCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 240,
  },
  overlayText: {
    textAlign: 'center',
  },
});
