export type AdUnitSlot =
  | 'aiCamera.adaptiveBanner'
  | 'aiCamera.interstitial'
  | 'pedometer.homeBanner'
  | 'pedometer.goalInsightInterstitial';

export type AdUnitsProductionIds = {
  aiCamera: {
    adaptiveBanner: string;
    interstitial: string;
  };
  pedometer: {
    homeBanner: string;
    goalInsightInterstitial: string;
  };
};
