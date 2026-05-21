import type {
  AppEntitlements,
  AppStoreProduct,
  PurchaseHistorySummary,
  PurchaseOutcome,
  StoreProductKey,
} from '@rn-health/core';
import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';
import { buildEntitlements } from './buildEntitlements';
import { buildPurchaseHistory } from './buildPurchaseHistory';
import {
  findPackageForProductKey,
  mapOfferingToStoreProducts,
} from './mapOfferingToStoreProducts';
import {
  setPremiumStoreProductId,
  setRemoveAdsStoreProductId,
} from './storeProductIdCache';
import { incrementOneTimePasses } from './oneTimePassStorage';
import {
  isPurchasesConfigured,
  markPurchasesConfigured,
  runPurchase,
} from './purchaseResult';
import {
  hasLocalRevenueCatConfig,
  revenueCatConfig,
} from './resolveRevenueCatConfig';

export type RevenueCatDiagnosticsSnapshot = {
  configured: boolean;
  hasLocalConfig: boolean;
  platform: string;
  configureError: string | null;
  offeringIdentifier: string | null;
  packageCount: number;
  products: AppStoreProduct[];
  customerInfoSummary: Record<string, unknown> | null;
  activeEntitlementIds: string[];
  originalAppUserId: string | null;
  entitlements: AppEntitlements;
  lastRefreshAt: string | null;
  lastRefreshError: string | null;
};

let configureError: string | null = null;
let currentOffering: PurchasesOffering | null = null;
let currentCustomerInfo: CustomerInfo | null = null;
let currentEntitlements: AppEntitlements = {
  isPremium: false,
  shouldHideAds: false,
  canUsePaidFeature: false,
  remainingOneTimePasses: 0,
  ownsRemoveAds: false,
};
let lastRefreshAt: string | null = null;
let lastRefreshError: string | null = null;

function getApiKey(): string {
  return Platform.OS === 'ios'
    ? revenueCatConfig.iosApiKey
    : revenueCatConfig.androidApiKey;
}

function isPlaceholderApiKey(apiKey: string): boolean {
  return apiKey.includes('PLACEHOLDER');
}

function summarizeCustomerInfo(
  customerInfo: CustomerInfo | null,
): Record<string, unknown> | null {
  if (!customerInfo) {
    return null;
  }

  return {
    activeSubscriptions: customerInfo.activeSubscriptions,
    allPurchasedProductIdentifiers:
      customerInfo.allPurchasedProductIdentifiers,
    latestExpirationDate: customerInfo.latestExpirationDate,
    managementURL: customerInfo.managementURL,
    requestDate: customerInfo.requestDate,
  };
}

async function applyCustomerInfo(customerInfo: CustomerInfo | null) {
  currentCustomerInfo = customerInfo;
  currentEntitlements = await buildEntitlements(customerInfo);
  lastRefreshAt = new Date().toISOString();
  lastRefreshError = null;
  return currentEntitlements;
}

export async function configureRevenueCat(): Promise<void> {
  configureError = null;

  const apiKey = getApiKey();
  if (isPlaceholderApiKey(apiKey)) {
    configureError =
      'RevenueCat API 키가 placeholder입니다. revenueCatConfig.ts를 설정해 주세요.';
    return;
  }

  try {
    if (__DEV__) {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    }

    Purchases.configure({ apiKey });
    markPurchasesConfigured(true);
    Purchases.addCustomerInfoUpdateListener(customerInfo => {
      applyCustomerInfo(customerInfo).catch(() => {});
    });
    await refreshAll();
  } catch (error) {
    markPurchasesConfigured(false);
    configureError =
      error instanceof Error
        ? error.message
        : 'RevenueCat configure에 실패했습니다.';
  }
}

export async function refreshOfferings(): Promise<AppStoreProduct[]> {
  if (!isPurchasesConfigured()) {
    currentOffering = null;
    return mapOfferingToStoreProducts(null);
  }

  try {
    const offerings = await Purchases.getOfferings();
    currentOffering = offerings.current;
    const products = mapOfferingToStoreProducts(currentOffering);
    setRemoveAdsStoreProductId(
      products.find(product => product.key === 'removeAds')?.storeProductId ??
        null,
    );
    setPremiumStoreProductId(
      products.find(product => product.key === 'premium')?.storeProductId ??
        null,
    );
    lastRefreshError = null;
    return products;
  } catch (error) {
    lastRefreshError =
      error instanceof Error ? error.message : 'Offering refresh 실패';
    return mapOfferingToStoreProducts(currentOffering);
  }
}

export async function refreshCustomerInfo(): Promise<AppEntitlements> {
  if (!isPurchasesConfigured()) {
    return applyCustomerInfo(null);
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return applyCustomerInfo(customerInfo);
  } catch (error) {
    lastRefreshError =
      error instanceof Error ? error.message : 'CustomerInfo refresh 실패';
    return currentEntitlements;
  }
}

export async function refreshAll(): Promise<{
  products: AppStoreProduct[];
  entitlements: AppEntitlements;
}> {
  const [products, entitlements] = await Promise.all([
    refreshOfferings(),
    refreshCustomerInfo(),
  ]);
  return { products, entitlements };
}

async function purchasePackageForKey(
  key: StoreProductKey,
): Promise<PurchaseOutcome> {
  if (!isPurchasesConfigured()) {
    return {
      status: 'failed',
      message: configureError ?? 'RevenueCat SDK가 아직 구성되지 않았어요.',
    };
  }

  const pkg: PurchasesPackage | null = findPackageForProductKey(
    currentOffering,
    key,
  );
  if (!pkg) {
    return {
      status: 'failed',
      message: '상품 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
    };
  }

  const outcome = await runPurchase(async () => {
    const result = await Purchases.purchasePackage(pkg);
    if (result.productIdentifier) {
      if (key === 'removeAds') {
        setRemoveAdsStoreProductId(result.productIdentifier);
      }
      if (key === 'premium') {
        setPremiumStoreProductId(result.productIdentifier);
      }
    }
    await applyCustomerInfo(result.customerInfo);
    if (key === 'oneTimePass') {
      await incrementOneTimePasses();
    }
    currentEntitlements = await buildEntitlements(currentCustomerInfo);
  });

  if (outcome.status === 'success') {
    await refreshCustomerInfo();
    currentEntitlements = getEntitlements();
  }

  return outcome;
}

export function purchaseRemoveAds(): Promise<PurchaseOutcome> {
  return purchasePackageForKey('removeAds');
}

export function purchaseOneTimePass(): Promise<PurchaseOutcome> {
  return purchasePackageForKey('oneTimePass');
}

export function purchasePremium(): Promise<PurchaseOutcome> {
  return purchasePackageForKey('premium');
}

export async function restorePurchases(): Promise<PurchaseOutcome> {
  if (!isPurchasesConfigured()) {
    return {
      status: 'failed',
      message: configureError ?? 'RevenueCat SDK가 아직 구성되지 않았어요.',
    };
  }

  const outcome = await runPurchase(async () => {
    const customerInfo = await Purchases.restorePurchases();
    await applyCustomerInfo(customerInfo);
  });

  if (outcome.status === 'success') {
    await refreshCustomerInfo();
  }

  return outcome;
}

export function getEntitlements(): AppEntitlements {
  return currentEntitlements;
}

export function getStoreProducts(): AppStoreProduct[] {
  return mapOfferingToStoreProducts(currentOffering);
}

export function getPurchaseHistorySummary(): PurchaseHistorySummary {
  return buildPurchaseHistory(
    currentCustomerInfo,
    currentEntitlements,
    getStoreProducts(),
    lastRefreshAt,
  );
}

export async function consumeOneTimePassAfterReportSuccess(): Promise<number> {
  const { decrementOneTimePasses } = await import('./oneTimePassStorage');
  const remaining = await decrementOneTimePasses();
  currentEntitlements = await buildEntitlements(currentCustomerInfo);
  return remaining;
}

export async function getDiagnosticsSnapshot(): Promise<RevenueCatDiagnosticsSnapshot> {
  const products = mapOfferingToStoreProducts(currentOffering);

  return {
    configured: isPurchasesConfigured(),
    hasLocalConfig: hasLocalRevenueCatConfig(),
    platform: Platform.OS,
    configureError,
    offeringIdentifier: currentOffering?.identifier ?? null,
    packageCount: currentOffering?.availablePackages.length ?? 0,
    products,
    customerInfoSummary: summarizeCustomerInfo(currentCustomerInfo),
    activeEntitlementIds: Object.keys(
      currentCustomerInfo?.entitlements.active ?? {},
    ),
    originalAppUserId: currentCustomerInfo?.originalAppUserId ?? null,
    entitlements: currentEntitlements,
    lastRefreshAt,
    lastRefreshError,
  };
}
