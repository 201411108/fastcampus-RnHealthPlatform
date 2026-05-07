export const healthPlatformTag = 'rn-health-platform';

export type { AdUnitSlot, AdUnitsProductionIds } from './ads/adUnitSlots';
export { configureAdUnits } from './ads/configureAdUnits';
export { getAdUnitId } from './ads/getAdUnitId';
export { initializeMobileAds } from './ads/initializeMobileAds';
export { loadAndShowInterstitialForSlot } from './ads/loadAndShowInterstitial';
export { useInterstitialAd } from './ads/useInterstitialAd';

export { createGeminiGenerativeModel } from './ai/createGeminiGenerativeModel';
export type { CreateGeminiModelParams } from './ai/createGeminiGenerativeModel';
export { generateContentWithImageAndText } from './ai/generateContentWithImageAndText';
export type {
  GenerateContentWithImageAndTextParams,
  GenerateImageAndTextResult,
} from './ai/generateContentWithImageAndText';
export { generateTextFromPrompt } from './ai/generateTextFromPrompt';
export type {
  GenerateTextFromPromptParams,
  GenerateTextResult,
} from './ai/generateTextFromPrompt';
