let removeAdsStoreProductId: string | null = null;
let premiumStoreProductId: string | null = null;

export function setRemoveAdsStoreProductId(productId: string | null) {
  removeAdsStoreProductId = productId;
}

export function getRemoveAdsStoreProductId(): string | null {
  return removeAdsStoreProductId;
}

export function setPremiumStoreProductId(productId: string | null) {
  premiumStoreProductId = productId;
}

export function getPremiumStoreProductId(): string | null {
  return premiumStoreProductId;
}
