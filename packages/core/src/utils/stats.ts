import type {DailyHealthReport, DailyHealthReportInput} from '../types/healthReport';
import type {NutritionTotals} from '../types/nutrition';
import type {FoodRecord} from '../types/record';

const EMPTY_NUTRITION_TOTALS: NutritionTotals = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
};

export function calculateProgressPercent(
  stepCount: number,
  goalStepCount: number,
): number {
  if (
    !Number.isFinite(stepCount) ||
    !Number.isFinite(goalStepCount) ||
    stepCount < 0 ||
    goalStepCount <= 0
  ) {
    return 0;
  }

  return (stepCount / goalStepCount) * 100;
}

export function sumFoodNutrition(records: FoodRecord[]): NutritionTotals {
  return records.reduce<NutritionTotals>(
    (totals, record) => ({
      calories: totals.calories + record.analysisResult.calories,
      protein: totals.protein + record.analysisResult.nutrition.protein,
      carbs: totals.carbs + record.analysisResult.nutrition.carbs,
      fat: totals.fat + record.analysisResult.nutrition.fat,
    }),
    EMPTY_NUTRITION_TOTALS,
  );
}

export function createDailyHealthReport(
  input: DailyHealthReportInput,
): DailyHealthReport {
  const nutrition = sumFoodNutrition(input.foodRecords);
  const insights = [
    `총 ${input.stepSummary.stepCount}보를 걸었습니다.`,
    `섭취 기록 ${input.foodRecords.length}건을 합산했습니다.`,
  ];

  return {
    date: input.date,
    summary: `${input.date} 건강 리포트`,
    nutrition,
    steps: input.stepSummary,
    insights,
  };
}
