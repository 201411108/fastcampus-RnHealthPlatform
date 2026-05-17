import {TestIds} from 'react-native-google-mobile-ads';
import type {AdUnitSlot} from './adUnitSlots';
import {getProductionAdUnits} from './adUnitsState';

export function getAdUnitId(slot: AdUnitSlot): string {
  if (__DEV__) {
    switch (slot) {
      case 'aiCamera.adaptiveBanner':
      case 'mainTabs.homeBanner':
      case 'mainTabs.historyBanner':
      case 'pedometer.homeBanner':
        return TestIds.ADAPTIVE_BANNER;
      case 'aiCamera.interstitial':
      case 'pedometer.goalInsightInterstitial':
        return TestIds.INTERSTITIAL;
      default: {
        const _exhaustive: never = slot;
        return _exhaustive;
      }
    }
  }

  const ids = getProductionAdUnits();
  switch (slot) {
    case 'aiCamera.adaptiveBanner':
      return ids?.aiCamera.adaptiveBanner?.trim() || TestIds.ADAPTIVE_BANNER;
    case 'aiCamera.interstitial':
      return ids?.aiCamera.interstitial?.trim() || TestIds.INTERSTITIAL;
    case 'mainTabs.homeBanner':
      return ids?.mainTabs.homeBanner?.trim() || TestIds.ADAPTIVE_BANNER;
    case 'mainTabs.historyBanner':
      return ids?.mainTabs.historyBanner?.trim() || TestIds.ADAPTIVE_BANNER;
    case 'pedometer.homeBanner':
      return ids?.pedometer.homeBanner?.trim() || TestIds.ADAPTIVE_BANNER;
    case 'pedometer.goalInsightInterstitial':
      return ids?.pedometer.goalInsightInterstitial?.trim() ||
        TestIds.INTERSTITIAL;
    default: {
      const _exhaustive: never = slot;
      return _exhaustive;
    }
  }
}
