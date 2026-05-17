import type {AdUnitsProductionIds} from './adUnitSlots';
import {setProductionAdUnits} from './adUnitsState';

/**
 * 앱 기동 시 한 번 호출해 프로덕션 광고 단위 ID를 등록합니다.
 * `__DEV__`일 때는 `getAdUnitId`가 Google 테스트 단위를 반환합니다.
 */
export function configureAdUnits(ids: AdUnitsProductionIds) {
  if (!__DEV__) {
    const missing: string[] = [];
    if (!ids.aiCamera.adaptiveBanner?.trim()) {
      missing.push('aiCamera.adaptiveBanner');
    }
    if (!ids.aiCamera.interstitial?.trim()) {
      missing.push('aiCamera.interstitial');
    }
    if (!ids.mainTabs.homeBanner?.trim()) {
      missing.push('mainTabs.homeBanner');
    }
    if (!ids.mainTabs.historyBanner?.trim()) {
      missing.push('mainTabs.historyBanner');
    }
    if (!ids.pedometer.homeBanner?.trim()) {
      missing.push('pedometer.homeBanner');
    }
    if (!ids.pedometer.goalInsightInterstitial?.trim()) {
      missing.push('pedometer.goalInsightInterstitial');
    }
    if (missing.length > 0) {
      console.warn(
        '[@rn-health/core] configureAdUnits: 빈 광고 단위 ID —',
        missing.join(', '),
      );
    }
  }
  setProductionAdUnits(ids);
}
