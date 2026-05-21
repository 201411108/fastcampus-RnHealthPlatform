import {useEffect, useMemo, useState} from 'react';
import {Platform, StatusBar} from 'react-native';
import {
  AdEventType,
  InterstitialAd,
} from 'react-native-google-mobile-ads';
import {getShouldHideAds} from './adVisibilityPolicy';
import type {AdUnitSlot} from './adUnitSlots';
import {getAdUnitId} from './getAdUnitId';

/**
 * 화면(예: 카메라)에서 미리 전면 광고를 로드해 두고 표시할 때 사용합니다.
 */
export function useInterstitialAd(slot: AdUnitSlot) {
  const unitId = useMemo(() => getAdUnitId(slot), [slot]);
  const [loaded, setLoaded] = useState(false);

  const interstitial = useMemo(
    () => InterstitialAd.createForAdRequest(unitId, {}),
    [unitId],
  );

  useEffect(() => {
    if (getShouldHideAds()) {
      return;
    }

    const unsubscribeLoaded = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        setLoaded(true);
      },
    );

    const unsubscribeOpened = interstitial.addAdEventListener(
      AdEventType.OPENED,
      () => {
        if (Platform.OS === 'ios') {
          StatusBar.setHidden(true);
        }
      },
    );

    const unsubscribeClosed = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        if (Platform.OS === 'ios') {
          StatusBar.setHidden(false);
        }
      },
    );

    interstitial.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeOpened();
      unsubscribeClosed();
    };
  }, [interstitial]);

  return {loaded, interstitial};
}
