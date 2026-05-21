import type { AppStoreProduct, StoreProductKey } from '@rn-health/core';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { revenueCatConfig } from './resolveRevenueCatConfig';

export const PRODUCT_COPY: Record<
  StoreProductKey,
  { title: string; description: string }
> = {
  removeAds: {
    title: '광고 제거권',
    description: '배너·전면 광고를 영구적으로 숨깁니다.',
  },
  oneTimePass: {
    title: '1회 이용권',
    description: 'Daily Report AI 생성을 1회 사용할 수 있어요.',
  },
  premium: {
    title: '프리미엄',
    description: '광고 없이 Daily Report를 무제한 생성할 수 있어요.',
  },
};

function findPackageByIdentifier(
  offering: PurchasesOffering | null,
  packageIdentifier: string,
): PurchasesPackage | null {
  if (!offering) {
    return null;
  }

  return (
    offering.availablePackages.find(
      pkg => pkg.identifier === packageIdentifier,
    ) ?? null
  );
}

function mapPackageToProduct(
  key: StoreProductKey,
  pkg: PurchasesPackage | null,
): AppStoreProduct {
  const copy = PRODUCT_COPY[key];
  const product = pkg?.product;

  return {
    key,
    title: copy.title,
    description: copy.description,
    priceString: product?.priceString ?? '가격 정보 없음',
    packageType: pkg?.packageType ?? 'UNKNOWN',
    storeProductId: product?.identifier ?? revenueCatConfig.productKeys[key],
    isAvailable: Boolean(pkg?.product),
  };
}

export function mapOfferingToStoreProducts(
  offering: PurchasesOffering | null,
): AppStoreProduct[] {
  const keys: StoreProductKey[] = ['removeAds', 'oneTimePass', 'premium'];

  return keys.map(key => {
    const packageIdentifier = revenueCatConfig.packageIdentifiers[key];
    const pkg = findPackageByIdentifier(offering, packageIdentifier);
    return mapPackageToProduct(key, pkg);
  });
}

export function findPackageForProductKey(
  offering: PurchasesOffering | null,
  key: StoreProductKey,
): PurchasesPackage | null {
  const packageIdentifier = revenueCatConfig.packageIdentifiers[key];
  return findPackageByIdentifier(offering, packageIdentifier);
}
