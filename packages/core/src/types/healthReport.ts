import type {NutritionTotals} from './nutrition';
import type {FoodRecord} from './record';
import type {StepDaySummary} from './stepInsight';

export type DailyHealthReportInput = {
  date: string;
  foodRecords: FoodRecord[];
  stepSummary: StepDaySummary;
};

export type DailyHealthReport = {
  date: string;
  summary: string;
  nutrition: NutritionTotals;
  steps: StepDaySummary;
  insights: string[];
};
