export type StoreProductKey = 'removeAds' | 'oneTimePass' | 'premium';

export type AppStoreProduct = {
  key: StoreProductKey;
  title: string;
  description: string;
  priceString: string;
  packageType: string;
  storeProductId: string;
  isAvailable: boolean;
};

export type AppEntitlements = {
  isPremium: boolean;
  shouldHideAds: boolean;
  canUsePaidFeature: boolean;
  remainingOneTimePasses: number;
  ownsRemoveAds: boolean;
};

export const EMPTY_ENTITLEMENTS: AppEntitlements = {
  isPremium: false,
  shouldHideAds: false,
  canUsePaidFeature: false,
  remainingOneTimePasses: 0,
  ownsRemoveAds: false,
};

export type PurchaseOutcome =
  | { status: 'success' }
  | { status: 'cancelled'; message: string }
  | { status: 'failed'; message: string };

export type PurchaseHistoryStatus =
  | 'active'
  | 'owned'
  | 'available'
  | 'expired';

export type PurchaseHistoryItem = {
  id: string;
  productKey?: StoreProductKey;
  title: string;
  status: PurchaseHistoryStatus;
  statusLabel: string;
  purchasedAt?: string | null;
  expiresAt?: string | null;
  note?: string;
};

export type PurchaseHistorySummary = {
  items: PurchaseHistoryItem[];
  subscriptionManagementUrl: string | null;
  lastUpdatedAt: string | null;
};
