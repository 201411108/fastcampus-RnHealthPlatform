import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AppStoreProduct, StoreProductKey } from '@rn-health/core';
import { useEntitlements } from '../hooks/useEntitlements';

type StoreScreenProps = {
  bottomPadding: number;
};

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

function showPurchaseOutcome(
  title: string,
  outcome: { status: string; message?: string },
): string {
  if (outcome.status === 'success') {
    Alert.alert(title, '구매가 완료되었어요.');
    return '';
  }

  if (outcome.status === 'cancelled') {
    const message = outcome.message ?? '구매가 취소되었어요.';
    Alert.alert(title, message);
    return message;
  }

  const message = outcome.message ?? '구매를 완료하지 못했어요. 잠시 후 다시 시도해 주세요.';
  Alert.alert(`${title} 실패`, message);
  return message;
}

type ProductCardProps = {
  product: AppStoreProduct;
  badgeLabel?: string;
  isOwned?: boolean;
  isPurchasing: boolean;
  isDisabled: boolean;
  onPurchase: () => void;
};

function ProductCard({
  product,
  badgeLabel,
  isOwned,
  isPurchasing,
  isDisabled,
  onPurchase,
}: ProductCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{product.title}</Text>
        {badgeLabel ? <Text style={styles.badge}>{badgeLabel}</Text> : null}
      </View>
      <Text style={styles.cardDescription}>{product.description}</Text>
      <Text style={styles.price}>{product.priceString}</Text>
      {isOwned ? (
        <Text style={styles.ownedLabel}>적용 중</Text>
      ) : (
        <Pressable
          onPress={onPurchase}
          disabled={isDisabled || !product.isAvailable}
          style={[
            styles.primaryButton,
            (isDisabled || !product.isAvailable) && styles.buttonDisabled,
          ]}
          accessibilityRole="button"
        >
          {isPurchasing ? (
            <ActivityIndicator color={appColors.inverseText} />
          ) : (
            <Text style={styles.primaryButtonLabel}>
              {product.key === 'premium' ? '구독하기' : '구매하기'}
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

export function StoreScreen({ bottomPadding }: StoreScreenProps) {
  const {
    entitlements,
    products,
    isReady,
    isRefreshing,
    purchasingProductKey,
    isRestoring,
    purchaseRemoveAds,
    purchaseOneTimePass,
    purchasePremium,
    restore,
  } = useEntitlements();
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState<'info' | 'error' | 'success'>('info');

  const findProduct = useCallback(
    (key: StoreProductKey) => products.find(product => product.key === key),
    [products],
  );

  const handlePurchase = useCallback(
    async (
      key: StoreProductKey,
      title: string,
      action: () => Promise<{ status: string; message?: string }>,
    ) => {
      setStatusMessage('');
      setStatusTone('info');
      const outcome = await action();
      const message = showPurchaseOutcome(title, outcome);
      if (outcome.status === 'success') {
        setStatusTone('success');
        setStatusMessage('구매가 완료되었어요. 권한이 반영되었습니다.');
        return;
      }
      if (message) {
        setStatusTone(outcome.status === 'failed' ? 'error' : 'info');
        setStatusMessage(message);
      }
    },
    [],
  );

  const handleRestore = useCallback(async () => {
    setStatusMessage('');
    setStatusTone('info');
    const outcome = await restore();
    const message = showPurchaseOutcome('구매 복원', outcome);
    if (outcome.status === 'success') {
      setStatusTone('success');
      setStatusMessage(
        '구독·광고 제거권이 복원되었어요. 1회 이용권 잔량은 이 기기에 저장된 값만 유지됩니다.',
      );
      return;
    }
    if (message) {
      setStatusTone(outcome.status === 'failed' ? 'error' : 'info');
      setStatusMessage(message);
    }
  }, [restore]);

  const removeAdsProduct = findProduct('removeAds');
  const oneTimePassProduct = findProduct('oneTimePass');
  const premiumProduct = findProduct('premium');
  const isPurchaseDisabled = Boolean(purchasingProductKey) || isRestoring;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPadding + spacing.xl },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>스토어</Text>
          <Text style={styles.description}>
            Daily Report와 광고 경험을 업그레이드할 수 있어요.
          </Text>
        </View>

        {!isReady || isRefreshing ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={appColors.primary} />
            <Text style={styles.helperText}>상품 정보를 불러오는 중이에요</Text>
          </View>
        ) : null}

        {oneTimePassProduct ? (
          <ProductCard
            product={oneTimePassProduct}
            badgeLabel={`잔여 ${entitlements.remainingOneTimePasses}회`}
            isPurchasing={purchasingProductKey === 'oneTimePass'}
            isDisabled={isPurchaseDisabled}
            onPurchase={() =>
              handlePurchase('oneTimePass', '1회 이용권', purchaseOneTimePass)
            }
          />
        ) : null}

        {removeAdsProduct ? (
          <ProductCard
            product={removeAdsProduct}
            isOwned={entitlements.ownsRemoveAds || entitlements.isPremium}
            isPurchasing={purchasingProductKey === 'removeAds'}
            isDisabled={
              isPurchaseDisabled ||
              entitlements.ownsRemoveAds ||
              entitlements.isPremium
            }
            onPurchase={() =>
              handlePurchase('removeAds', '광고 제거권', purchaseRemoveAds)
            }
          />
        ) : null}

        {premiumProduct ? (
          <ProductCard
            product={premiumProduct}
            isOwned={entitlements.isPremium}
            isPurchasing={purchasingProductKey === 'premium'}
            isDisabled={isPurchaseDisabled || entitlements.isPremium}
            onPurchase={() =>
              handlePurchase('premium', '프리미엄', purchasePremium)
            }
          />
        ) : null}

        <Pressable
          onPress={handleRestore}
          disabled={isPurchaseDisabled}
          style={[styles.secondaryButton, isPurchaseDisabled && styles.buttonDisabled]}
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
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    padding: spacing.lg,
    gap: spacing.md,
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
  cardDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: appColors.textMuted,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: appColors.primary,
  },
  ownedLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: appColors.primary,
  },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: appColors.primary,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonLabel: {
    color: appColors.inverseText,
    fontSize: 16,
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
