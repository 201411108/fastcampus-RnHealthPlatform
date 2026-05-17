import {
  calculateProgressPercent,
  type DailyHealthReportInput,
  type FoodRecord,
  type StepDaySummary,
} from '@rn-health/core';
import type {DailyReportDataSources, DailyReportSourceState} from '../types/dailyReport';

const DEFAULT_GOAL_STEP_COUNT = 10_000;

export type BuildDailyReportInputParams = {
  date: string;
  dataSources: DailyReportDataSources;
};

export type BuildDailyReportInputResult = {
  input: DailyHealthReportInput;
  sourceState: DailyReportSourceState;
};

function createEmptyStepSummary(date: string): StepDaySummary {
  return {
    date,
    stepCount: 0,
    goalStepCount: DEFAULT_GOAL_STEP_COUNT,
    progressPercent: calculateProgressPercent(0, DEFAULT_GOAL_STEP_COUNT),
  };
}

function normalizeFoodRecords(records: FoodRecord[]) {
  return records.filter(record => record.createdAt && record.analysisResult);
}

function normalizeStepSummary(
  date: string,
  stepSummary: StepDaySummary | null,
): StepDaySummary {
  if (!stepSummary) {
    return createEmptyStepSummary(date);
  }

  return {
    date,
    stepCount: Number.isFinite(stepSummary.stepCount) ? stepSummary.stepCount : 0,
    goalStepCount:
      Number.isFinite(stepSummary.goalStepCount) && stepSummary.goalStepCount > 0
        ? stepSummary.goalStepCount
        : DEFAULT_GOAL_STEP_COUNT,
    progressPercent: calculateProgressPercent(
      Number.isFinite(stepSummary.stepCount) ? stepSummary.stepCount : 0,
      Number.isFinite(stepSummary.goalStepCount) && stepSummary.goalStepCount > 0
        ? stepSummary.goalStepCount
        : DEFAULT_GOAL_STEP_COUNT,
    ),
  };
}

export async function buildDailyReportInput({
  date,
  dataSources,
}: BuildDailyReportInputParams): Promise<BuildDailyReportInputResult> {
  const [rawFoodRecords, rawStepSummary] = await Promise.all([
    dataSources.loadFoodRecords(date),
    dataSources.loadStepSummary(date),
  ]);

  const foodRecords = normalizeFoodRecords(rawFoodRecords);
  const stepSummary = normalizeStepSummary(date, rawStepSummary);
  const hasFoodRecords = foodRecords.length > 0;
  const hasStepRecords = stepSummary.stepCount > 0;
  const hasMetStepGoal =
    stepSummary.goalStepCount > 0 &&
    stepSummary.stepCount >= stepSummary.goalStepCount;

  return {
    input: {
      date,
      foodRecords,
      stepSummary,
    },
    sourceState: {
      hasFoodRecords,
      hasStepRecords,
      isPartial: hasFoodRecords !== hasStepRecords,
      foodRecordCount: foodRecords.length,
      stepCount: stepSummary.stepCount,
      goalStepCount: stepSummary.goalStepCount,
      progressPercent: stepSummary.progressPercent,
      hasMetStepGoal,
    },
  };
}
