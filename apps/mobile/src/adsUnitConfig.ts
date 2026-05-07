import { Platform } from 'react-native';
import type { AdUnitsProductionIds } from '@rn-health/core';

/**
 * 저장소에는 Google AdMob **공개 테스트** 퍼블리셔/단위 ID만 둡니다.
 * 스토어 배포 전 AdMob 콘솔에서 발급한 앱·단위 ID로 반드시 교체하세요.
 */
const TEST_BANNER_IOS = 'ca-app-pub-3940256099942544/2934735716';
const TEST_BANNER_ANDROID = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL_IOS = 'ca-app-pub-3940256099942544/4411468910';
const TEST_INTERSTITIAL_ANDROID =
  'ca-app-pub-3940256099942544/1033173712';

/**
 * 프로덕션 빌드에서 사용할 OS별 광고 단위.
 * `__DEV__`일 때는 core `getAdUnitId`가 `TestIds`를 쓰므로 이 값은 참조되지 않습니다.
 */
export const productionAdUnits: AdUnitsProductionIds = {
  aiCamera: {
    adaptiveBanner:
      Platform.OS === 'ios' ? TEST_BANNER_IOS : TEST_BANNER_ANDROID,
    interstitial:
      Platform.OS === 'ios' ? TEST_INTERSTITIAL_IOS : TEST_INTERSTITIAL_ANDROID,
  },
  pedometer: {
    homeBanner:
      Platform.OS === 'ios' ? TEST_BANNER_IOS : TEST_BANNER_ANDROID,
    goalInsightInterstitial:
      Platform.OS === 'ios' ? TEST_INTERSTITIAL_IOS : TEST_INTERSTITIAL_ANDROID,
  },
};
