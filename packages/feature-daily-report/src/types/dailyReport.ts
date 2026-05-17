import type {
  DailyHealthReport,
  FoodRecord,
  StepDaySummary,
} from '@rn-health/core';

export type DailyReportDataSources = {
  loadFoodRecords: (date: string) => Promise<FoodRecord[]>;
  loadStepSummary: (date: string) => Promise<StepDaySummary | null>;
  /** 목표 걸음 달성 등 — `date` 기준으로 생성 가능 여부 */
  canGenerateReport?: (date: string) => boolean | Promise<boolean>;
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
  /** 걸음 `stepCount >= goalStepCount` (목표가 0보다 클 때) */
  hasMetStepGoal: boolean;
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
