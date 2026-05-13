import type {
  DailyHealthReport,
  FoodRecord,
  StepDaySummary,
} from '@rn-health/core';

export type DailyReportDataSources = {
  loadFoodRecords: (date: string) => Promise<FoodRecord[]>;
  loadStepSummary: (date: string) => Promise<StepDaySummary | null>;
  canGenerateReport?: () => boolean | Promise<boolean>;
};

export type DailyReportGenerationStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'generating'
  | 'success'
  | 'empty'
  | 'error'
  | 'locked';

export type DailyReportSourceState = {
  hasFoodRecords: boolean;
  hasStepRecords: boolean;
  isPartial: boolean;
  foodRecordCount: number;
  stepCount: number;
  goalStepCount: number;
  progressPercent: number;
};

export type DailyReportHistoryItem = {
  id: string;
  createdAt: string;
  report: DailyHealthReport;
};

export type DailyReportGenerationResult = {
  report: DailyHealthReport;
  isFallback: boolean;
};
