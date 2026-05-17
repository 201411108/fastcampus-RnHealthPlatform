export type AdUnitSlot =
  | 'aiCamera.adaptiveBanner'
  | 'aiCamera.interstitial'
  | 'mainTabs.homeBanner'
  | 'mainTabs.historyBanner'
  | 'pedometer.homeBanner'
  | 'pedometer.goalInsightInterstitial';

export type AdUnitsProductionIds = {
  aiCamera: {
    adaptiveBanner: string;
    interstitial: string;
  };
  mainTabs: {
    homeBanner: string;
    historyBanner: string;
  };
  pedometer: {
    homeBanner: string;
    goalInsightInterstitial: string;
  };
};
