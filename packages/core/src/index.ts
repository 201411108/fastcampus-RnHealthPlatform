export const healthPlatformTag = 'rn-health-platform';

export type {FoodAnalysisResult, Nutrition, NutritionTotals} from './types/nutrition';
export type {FoodRecord} from './types/record';
export type {
  StepDaySummary,
  StepInsightHistoryItem,
  StepInsightResult,
} from './types/stepInsight';
export {
  EMPTY_STEP_INSIGHT_RESULT,
  STEP_INSIGHT_FIELD_MAX_LENGTH,
  STEP_INSIGHT_SENTENCE_RULE,
} from './types/stepInsight';
export type {
  DailyHealthReport,
  DailyHealthReportInput,
} from './types/healthReport';

export {
  compareISODateDesc,
  isValidISODate,
  toISODate,
} from './utils/date';
export {
  calculateProgressPercent,
  createDailyHealthReport,
  sumFoodNutrition,
} from './utils/stats';
export {
  extractFirstJsonObject,
  normalizeFoodAnalysisResult,
  normalizeStepInsightResult,
  parseJsonObject,
  stripJsonCodeFence,
} from './utils/aiResponse';

export type { AdUnitSlot, AdUnitsProductionIds } from './ads/adUnitSlots';
export { configureAdUnits } from './ads/configureAdUnits';
export { getAdUnitId } from './ads/getAdUnitId';
export { initializeMobileAds } from './ads/initializeMobileAds';
export { loadAndShowInterstitialForSlot } from './ads/loadAndShowInterstitial';
export { useInterstitialAd } from './ads/useInterstitialAd';
