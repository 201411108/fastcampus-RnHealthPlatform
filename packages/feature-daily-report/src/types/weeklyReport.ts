import type {NutritionTotals, StepDaySummary} from '@rn-health/core';

export type WeeklyReportDayPoint = {
  date: string;
  nutrition: NutritionTotals;
  foodRecordCount: number;
  stepSummary: StepDaySummary | null;
};

export type WeeklyReportDataSources = {
  loadWeekSeries: (mondayISO: string) => Promise<WeeklyReportDayPoint[]>;
};
