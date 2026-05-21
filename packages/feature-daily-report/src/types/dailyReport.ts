import type {
  DailyHealthReport,
  FoodRecord,
  StepDaySummary,
} from '@rn-health/core';

export type DailyReportDataSources = {
  loadFoodRecords: (date: string) => Promise<FoodRecord[]>;
  loadStepSummary: (date: string) => Promise<StepDaySummary | null>;
  /** Daily Report AI 생성 권한(프리미엄·1회권). false면 생성만 잠금 */
  checkReportAccess?: () => boolean | Promise<boolean>;
  /** 목표 걸음 달성 등 — `date` 기준으로 생성 가능 여부 */
  canGenerateReport?: (date: string) => boolean | Promise<boolean>;
  /** AI 생성 성공 후 1회권 차감 등 */
  onReportGeneratedSuccess?: () => void | Promise<void>;
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
