import type {
  AppEntitlements,
  AppStoreProduct,
  PurchaseHistoryItem,
  PurchaseHistorySummary,
  StoreProductKey,
} from '@rn-health/core';
import type {
  CustomerInfo,
  PurchasesEntitlementInfo,
} from 'react-native-purchases';
import { revenueCatConfig } from './resolveRevenueCatConfig';
import { PRODUCT_COPY } from './mapOfferingToStoreProducts';
import {
  getPremiumStoreProductId,
  getRemoveAdsStoreProductId,
} from './storeProductIdCache';

function formatDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString('ko-KR');
}

function matchesIdentifier(value: string, matchIds: string[]): boolean {
  return matchIds.some(
    matchId =>
      value === matchId || value.includes(matchId) || matchId.includes(value),
  );
}

function collectRemoveAdsMatchIds(): string[] {
  const ids = new Set<string>([
    revenueCatConfig.productKeys.removeAds,
    revenueCatConfig.entitlementIds.removeAds,
  ]);

  const storeProductId = getRemoveAdsStoreProductId();
  if (storeProductId) {
    ids.add(storeProductId);
  }

  return [...ids];
}

function collectPremiumMatchIds(): string[] {
  const ids = new Set<string>([
    revenueCatConfig.productKeys.premium,
    revenueCatConfig.entitlementIds.premium,
    'premium',
  ]);

  const storeProductId = getPremiumStoreProductId();
  if (storeProductId) {
    ids.add(storeProductId);
    const baseId = storeProductId.split(':')[0];
    if (baseId) {
      ids.add(baseId);
    }
  }

  return [...ids];
}

function findActiveEntitlement(
  customerInfo: CustomerInfo,
  matchIds: string[],
): PurchasesEntitlementInfo | null {
  for (const [entitlementId, entitlement] of Object.entries(
    customerInfo.entitlements.active,
  )) {
    if (!entitlement.isActive) {
      continue;
    }

    if (
      matchesIdentifier(entitlementId, matchIds) ||
      (entitlement.productIdentifier &&
        matchesIdentifier(entitlement.productIdentifier, matchIds))
    ) {
      return entitlement;
    }
  }

  return null;
}

function findLatestNonSubscriptionPurchaseDate(
  customerInfo: CustomerInfo,
  matchIds: string[],
): string | null {
  const transactions = customerInfo.nonSubscriptionTransactions ?? [];
  const matchedDates = transactions
    .filter(transaction =>
      matchesIdentifier(transaction.productIdentifier, matchIds),
    )
    .map(transaction => transaction.purchaseDate)
    .filter(Boolean);

  if (matchedDates.length === 0) {
    return null;
  }

  return matchedDates.sort(
    (left, right) => new Date(right).getTime() - new Date(left).getTime(),
  )[0];
}

function getProductTitle(
  key: StoreProductKey,
  products: AppStoreProduct[],
): string {
  return products.find(product => product.key === key)?.title ?? PRODUCT_COPY[key].title;
}

function buildPremiumItem(
  customerInfo: CustomerInfo | null,
  entitlements: AppEntitlements,
  products: AppStoreProduct[],
): PurchaseHistoryItem | null {
  if (!customerInfo && !entitlements.isPremium) {
    return null;
  }

  const matchIds = collectPremiumMatchIds();
  const activeEntitlement = customerInfo
    ? findActiveEntitlement(customerInfo, matchIds)
    : null;
  const hasActiveSubscription = (customerInfo?.activeSubscriptions ?? []).some(
    subscriptionId => matchesIdentifier(subscriptionId, matchIds),
  );

  if (!entitlements.isPremium && !activeEntitlement && !hasActiveSubscription) {
    return null;
  }

  const purchasedAt = formatDate(
    activeEntitlement?.originalPurchaseDate ??
      activeEntitlement?.latestPurchaseDate ??
      (customerInfo
        ? findLatestNonSubscriptionPurchaseDate(customerInfo, matchIds)
        : null),
  );
  const expiresAt = formatDate(
    activeEntitlement?.expirationDate ?? customerInfo?.latestExpirationDate,
  );
  const isActive = entitlements.isPremium;

  return {
    id: 'premium',
    productKey: 'premium',
    title: getProductTitle('premium', products),
    status: isActive ? 'active' : 'expired',
    statusLabel: isActive ? '적용 중' : '만료됨',
    purchasedAt,
    expiresAt,
    note: isActive ? '프리미엄 혜택이 적용 중이에요.' : undefined,
  };
}

function buildRemoveAdsItem(
  customerInfo: CustomerInfo | null,
  entitlements: AppEntitlements,
  products: AppStoreProduct[],
): PurchaseHistoryItem | null {
  if (!entitlements.ownsRemoveAds) {
    return null;
  }

  const matchIds = collectRemoveAdsMatchIds();
  const activeEntitlement = customerInfo
    ? findActiveEntitlement(customerInfo, matchIds)
    : null;
  const purchasedAt = formatDate(
    activeEntitlement?.originalPurchaseDate ??
      activeEntitlement?.latestPurchaseDate ??
      (customerInfo
        ? findLatestNonSubscriptionPurchaseDate(customerInfo, matchIds)
        : null),
  );

  return {
    id: 'removeAds',
    productKey: 'removeAds',
    title: getProductTitle('removeAds', products),
    status: 'owned',
    statusLabel: '적용 중',
    purchasedAt,
    note: '광고 제거권은 영구적으로 적용됩니다.',
  };
}

function buildOneTimePassItem(
  entitlements: AppEntitlements,
  products: AppStoreProduct[],
): PurchaseHistoryItem | null {
  if (entitlements.remainingOneTimePasses <= 0) {
    return null;
  }

  return {
    id: 'oneTimePass',
    productKey: 'oneTimePass',
    title: getProductTitle('oneTimePass', products),
    status: 'available',
    statusLabel: `잔여 ${entitlements.remainingOneTimePasses}회`,
    note: '1회 이용권 잔량은 이 기기에만 저장됩니다.',
  };
}

export function buildPurchaseHistory(
  customerInfo: CustomerInfo | null,
  entitlements: AppEntitlements,
  products: AppStoreProduct[],
  lastUpdatedAt: string | null,
): PurchaseHistorySummary {
  const items = [
    buildPremiumItem(customerInfo, entitlements, products),
    buildRemoveAdsItem(customerInfo, entitlements, products),
    buildOneTimePassItem(entitlements, products),
  ].filter((item): item is PurchaseHistoryItem => item !== null);

  return {
    items,
    subscriptionManagementUrl: customerInfo?.managementURL ?? null,
    lastUpdatedAt,
  };
}