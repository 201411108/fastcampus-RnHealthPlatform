import type { AppEntitlements } from '@rn-health/core';
import type { CustomerInfo, PurchasesEntitlementInfo } from 'react-native-purchases';
import { revenueCatConfig } from './resolveRevenueCatConfig';
import { getRemainingOneTimePasses } from './oneTimePassStorage';
import {
  getPremiumStoreProductId,
  getRemoveAdsStoreProductId,
} from './storeProductIdCache';

function isEntitlementActive(
  customerInfo: CustomerInfo | null,
  entitlementId: string,
): boolean {
  if (!customerInfo) {
    return false;
  }

  const entitlement = customerInfo.entitlements.active[entitlementId];
  return entitlement?.isActive === true;
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

function entitlementMatches(
  entitlement: PurchasesEntitlementInfo,
  matchIds: string[],
): boolean {
  if (entitlement.productIdentifier && matchesIdentifier(entitlement.productIdentifier, matchIds)) {
    return true;
  }

  return false;
}

function hasActiveEntitlementMatch(
  customerInfo: CustomerInfo,
  matchIds: string[],
): boolean {
  for (const [entitlementId, entitlement] of Object.entries(
    customerInfo.entitlements.active,
  )) {
    if (!entitlement.isActive) {
      continue;
    }

    if (
      matchesIdentifier(entitlementId, matchIds) ||
      entitlementMatches(entitlement, matchIds)
    ) {
      return true;
    }
  }

  return false;
}

function hasSubscriptionMatch(
  customerInfo: CustomerInfo,
  matchIds: string[],
): boolean {
  const subscriptions = customerInfo.activeSubscriptions ?? [];
  return subscriptions.some(subscriptionId =>
    matchesIdentifier(subscriptionId, matchIds),
  );
}

function hasPurchasedProductMatch(
  customerInfo: CustomerInfo,
  matchIds: string[],
): boolean {
  const purchased = customerInfo.allPurchasedProductIdentifiers ?? [];
  return purchased.some(productId => matchesIdentifier(productId, matchIds));
}

function ownsRemoveAdsFromPurchases(customerInfo: CustomerInfo | null): boolean {
  if (!customerInfo) {
    return false;
  }

  const matchIds = collectRemoveAdsMatchIds();
  return (
    hasActiveEntitlementMatch(customerInfo, matchIds) ||
    hasPurchasedProductMatch(customerInfo, matchIds)
  );
}

function isPremiumFromCustomerInfo(customerInfo: CustomerInfo | null): boolean {
  if (!customerInfo) {
    return false;
  }

  if (isEntitlementActive(customerInfo, revenueCatConfig.entitlementIds.premium)) {
    return true;
  }

  const matchIds = collectPremiumMatchIds();
  return (
    hasActiveEntitlementMatch(customerInfo, matchIds) ||
    hasSubscriptionMatch(customerInfo, matchIds) ||
    hasPurchasedProductMatch(customerInfo, matchIds)
  );
}

export async function buildEntitlements(
  customerInfo: CustomerInfo | null,
): Promise<AppEntitlements> {
  const remainingOneTimePasses = await getRemainingOneTimePasses();
  const isPremium = isPremiumFromCustomerInfo(customerInfo);
  const ownsRemoveAds =
    isEntitlementActive(
      customerInfo,
      revenueCatConfig.entitlementIds.removeAds,
    ) || ownsRemoveAdsFromPurchases(customerInfo);
  const shouldHideAds = isPremium || ownsRemoveAds;
  const canUsePaidFeature = isPremium || remainingOneTimePasses > 0;

  return {
    isPremium,
    shouldHideAds,
    canUsePaidFeature,
    remainingOneTimePasses,
    ownsRemoveAds,
  };
}
