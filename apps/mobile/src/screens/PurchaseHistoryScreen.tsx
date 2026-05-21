import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { PurchaseHistoryItem } from '@rn-health/core';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEntitlements } from '../hooks/useEntitlements';
import { getPurchaseHistorySummary } from '../purchases/revenueCatService';

type RootStackParamList = {
  MainTabs: { screen: 'Store' } | undefined;
  PurchaseHistory: undefined;
};

type PurchaseHistoryNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

const appColors = {
  background: '#f8fafc',
  surface: '#ffffff',
  primary: '#047857',
  primarySoft: '#d1fae5',
  text: '#111827',
  textMuted: '#4b5563',
  border: '#e5e7eb',
  inverseText: '#ffffff',
};

const spacing = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

function showRestoreOutcome(outcome: {
  status: string;
  message?: string;
}): string {
  if (outcome.status === 'success') {
    Alert.alert('구매 복원', '구독·광고 제거권이 복원되었어요.');
    return '구독·광고 제거권이 복원되었어요. 1회 이용권 잔량은 이 기기에 저장된 값만 유지됩니다.';
  }

  if (outcome.status === 'cancelled') {
    const message = outcome.message ?? '복원이 취소되었어요.';
    Alert.alert('구매 복원', message);
    return message;
  }

  const message =
    outcome.message ?? '구매를 복원하지 못했어요. 잠시 후 다시 시도해 주세요.';
  Alert.alert('구매 복원 실패', message);
  return message;
}

type HistoryCardProps = {
  item: PurchaseHistoryItem;
};

function HistoryCard({ item }: HistoryCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.badge}>{item.statusLabel}</Text>
      </View>
      {item.purchasedAt ? (
        <Text style={styles.metaText}>구매일: {item.purchasedAt}</Text>
      ) : null}
      {item.expiresAt ? (
        <Text style={styles.metaText}>만료일: {item.expiresAt}</Text>
      ) : null}
      {item.note ? <Text style={styles.noteText}>{item.note}</Text> : null}
    </View>
  );
}

export function PurchaseHistoryScreen() {
  const navigation = useNavigation<PurchaseHistoryNavigationProp>();
  const {
    isReady,
    isRefreshing,
    isRestoring,
    purchasingProductKey,
    restore,
    refresh,
  } = useEntitlements();
  const [summary, setSummary] = useState(() => getPurchaseHistorySummary());
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState<'info' | 'error' | 'success'>(
    'info',
  );

  const loadSummary = useCallback(async () => {
    await refresh();
    setSummary(getPurchaseHistorySummary());
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      loadSummary().catch(() => {});
    }, [loadSummary]),
  );

  const handleOpenStore = useCallback(() => {
    navigation.navigate('MainTabs', { screen: 'Store' });
  }, [navigation]);

  const handleOpenSubscriptionManagement = useCallback(async () => {
    const url = summary.subscriptionManagementUrl?.trim();
    if (!url) {
      Alert.alert('구독 관리', '구독 관리 페이지를 열 수 없어요.');
      return;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('구독 관리', '링크를 열 수 없어요.');
      return;
    }

    await Linking.openURL(url);
  }, [summary.subscriptionManagementUrl]);

  const handleRestore = useCallback(async () => {
    setStatusMessage('');
    setStatusTone('info');
    const outcome = await restore();
    const message = showRestoreOutcome(outcome);
    setSummary(getPurchaseHistorySummary());

    if (outcome.status === 'success') {
      setStatusTone('success');
      setStatusMessage(
        '구독·광고 제거권이 복원되었어요. 1회 이용권 잔량은 이 기기에 저장된 값만 유지됩니다.',
      );
      return;
    }

    setStatusTone(outcome.status === 'failed' ? 'error' : 'info');
    setStatusMessage(message);
  }, [restore]);

  const isActionDisabled = Boolean(purchasingProductKey) || isRestoring;
  const isLoading = !isReady || isRefreshing;
  const hasItems = summary.items.length > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>구매 내역</Text>
          <Text style={styles.description}>
            현재 적용 중인 구매와 구독 상태를 확인할 수 있어요.
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={appColors.primary} />
            <Text style={styles.helperText}>구매 정보를 불러오는 중이에요</Text>
          </View>
        ) : null}

        {!isLoading && !hasItems ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>아직 구매 내역이 없어요</Text>
            <Text style={styles.emptyDescription}>
              스토어에서 상품을 구매하면 이곳에 표시됩니다.
            </Text>
            <Pressable
              onPress={handleOpenStore}
              style={styles.primaryButton}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonLabel}>스토어로 이동</Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoading && hasItems
          ? summary.items.map(item => <HistoryCard key={item.id} item={item} />)
          : null}

        {summary.subscriptionManagementUrl ? (
          <Pressable
            onPress={handleOpenSubscriptionManagement}
            style={styles.secondaryButton}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonLabel}>구독 관리 열기</Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={handleRestore}
          disabled={isActionDisabled}
          style={[
            styles.secondaryButton,
            isActionDisabled && styles.buttonDisabled,
          ]}
          accessibilityRole="button"
        >
          {isRestoring ? (
            <ActivityIndicator color={appColors.primary} />
          ) : (
            <Text style={styles.secondaryButtonLabel}>구매 복원</Text>
          )}
        </Pressable>

        <Text style={styles.footerNote}>
          1회 이용권 잔량은 이 기기에만 저장됩니다. 앱을 삭제하면 사라질 수
          있어요.
        </Text>

        {summary.lastUpdatedAt ? (
          <Text style={styles.updatedAtText}>
            마지막 갱신:{' '}
            {new Date(summary.lastUpdatedAt).toLocaleString('ko-KR')}
          </Text>
        ) : null}

        {statusMessage ? (
          <View
            style={[
              styles.statusBanner,
              statusTone === 'error' && styles.statusBannerError,
              statusTone === 'success' && styles.statusBannerSuccess,
            ]}
          >
            <Text
              style={[
                styles.statusMessage,
                statusTone === 'error' && styles.statusMessageError,
                statusTone === 'success' && styles.statusMessageSuccess,
              ]}
            >
              {statusMessage}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: appColors.text,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: appColors.textMuted,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  helperText: {
    fontSize: 14,
    color: appColors.textMuted,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    padding: spacing.lg,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: appColors.text,
  },
  emptyDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: appColors.textMuted,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: appColors.text,
    flex: 1,
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: appColors.primary,
    backgroundColor: appColors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  metaText: {
    fontSize: 14,
    color: appColors.textMuted,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    color: appColors.textMuted,
  },
  primaryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: appColors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  primaryButtonLabel: {
    color: appColors.inverseText,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColors.primary,
    backgroundColor: appColors.surface,
  },
  secondaryButtonLabel: {
    color: appColors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  footerNote: {
    fontSize: 13,
    lineHeight: 20,
    color: appColors.textMuted,
  },
  updatedAtText: {
    fontSize: 12,
    color: appColors.textMuted,
  },
  statusBanner: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    padding: spacing.md,
  },
  statusBannerError: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  statusBannerSuccess: {
    borderColor: appColors.primarySoft,
    backgroundColor: appColors.primarySoft,
  },
  statusMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: appColors.textMuted,
  },
  statusMessageError: {
    color: '#b91c1c',
    fontWeight: '600',
  },
  statusMessageSuccess: {
    color: appColors.primary,
    fontWeight: '600',
  },
});
