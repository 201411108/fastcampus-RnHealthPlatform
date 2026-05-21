/**
 * RevenueCat 설정 예시. 로컬 개발 시 이 파일을 복사해
 * `revenueCatConfig.ts`로 저장하고(gitignore) 실제 API 키·product id를 넣으세요.
 * 운영 secret과 실제 스토어 product id는 저장소에 커밋하지 마세요.
 */
export const revenueCatConfig = {
  iosApiKey: 'appl_DEV_PLACEHOLDER',
  androidApiKey: 'goog_DEV_PLACEHOLDER',
  entitlementIds: {
    premium: 'premium',
    removeAds: 'remove_ads',
  },
  /** Offering 패키지 identifier — RC 대시보드 패키지 id와 일치 */
  packageIdentifiers: {
    removeAds: '$rc_lifetime',
    oneTimePass: 'one_time_pass',
    premium: '$rc_monthly',
  },
  productKeys: {
    removeAds: 'remove_ads_product',
    oneTimePass: 'one_time_pass_product',
    premium: 'premium_subscription_product',
  },
} as const;

export type RevenueCatConfig = typeof revenueCatConfig;
