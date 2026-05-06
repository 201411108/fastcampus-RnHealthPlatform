import { useEffect, useState } from 'react';
import { Platform, StatusBar } from 'react-native';
import {
  AdEventType,
  InterstitialAd,
  TestIds,
} from 'react-native-google-mobile-ads';

/**
 * Google 제공 샘플 전면 광고 단위. 프로덕션에서는 환경 변수 등으로 교체합니다.
 * 저장소에 실제 광고 ID를 넣지 않기 위해 기본값으로 테스트 단위를 사용합니다.
 */
const INTERSTITIAL_FALLBACK_UNIT_ID =
  Platform.OS === 'ios'
    ? 'ca-app-pub-3940256099942544/4411468910'
    : 'ca-app-pub-3940256099942544/1033173712';

const interstitialAdUnitId = __DEV__
  ? TestIds.INTERSTITIAL
  : INTERSTITIAL_FALLBACK_UNIT_ID;

const interstitial = InterstitialAd.createForAdRequest(
  interstitialAdUnitId,
  {},
);

const useInterstitial = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
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
  }, []);

  return { loaded, interstitial };
};

export default useInterstitial;
