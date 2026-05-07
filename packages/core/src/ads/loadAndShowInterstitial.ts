import {AdEventType, InterstitialAd} from 'react-native-google-mobile-ads';
import type {AdUnitSlot} from './adUnitSlots';
import {getAdUnitId} from './getAdUnitId';

/**
 * 전면 광고를 로드·표시하고, 닫히거나 오류 시 완료됩니다.
 * AI 등 다른 비동기 작업과 `Promise.all`로 병렬 호출하기 적합합니다.
 */
export function loadAndShowInterstitialForSlot(
  slot: AdUnitSlot,
): Promise<void> {
  const unitId = getAdUnitId(slot);
  return new Promise(resolve => {
    let settled = false;
    const ad = InterstitialAd.createForAdRequest(unitId, {});
    let unsubscribe: () => void = () => {};

    const finish = () => {
      if (settled) {
        return;
      }
      settled = true;
      unsubscribe();
      resolve();
    };

    unsubscribe = ad.addAdEventsListener(({type}) => {
      switch (type) {
        case AdEventType.LOADED:
          try {
            ad.show();
          } catch {
            finish();
          }
          break;
        case AdEventType.ERROR:
        case AdEventType.CLOSED:
          finish();
          break;
        default:
          break;
      }
    });

    ad.load();
  });
}
