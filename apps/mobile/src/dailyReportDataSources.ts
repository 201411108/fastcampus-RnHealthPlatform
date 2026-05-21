import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  calculateProgressPercent,
  toISODate,
  type FoodRecord,
  type StepDaySummary,
} from '@rn-health/core';
import { getDailyStepSnapshotForDate } from '@rn-health/feature-pedometer';
import type { DailyReportDataSources } from '@rn-health/feature-daily-report';

const FOOD_RECORDS_STORAGE_KEY = '@food_records';
const STEP_INSIGHT_HISTORY_STORAGE_KEY = '@stepInsight/history/v1';

function isSameISODate(isoDateTime: string, date: string) {
  const timestamp = Date.parse(isoDateTime);
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  return toISODate(new Date(timestamp)) === date;
}

function isFoodRecord(value: unknown): value is FoodRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Partial<FoodRecord>;
  return (
    typeof record.id === 'string' &&
    typeof record.createdAt === 'string' &&
    typeof record.imageUri === 'string' &&
    !!record.analysisResult
  );
}

function isStepSummaryCandidate(value: unknown) {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Partial<StepDaySummary> & { createdAt?: unknown };
  return (
    typeof item.createdAt === 'string' &&
    typeof item.stepCount === 'number' &&
    Number.isFinite(item.stepCount) &&
    item.stepCount >= 0 &&
    typeof item.goalStepCount === 'number' &&
    Number.isFinite(item.goalStepCount) &&
    item.goalStepCount > 0
  );
}

function toTime(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function mergeStepSummaries(
  fromInsight: StepDaySummary | null,
  fromSnapshot: StepDaySummary | null,
): StepDaySummary | null {
  if (!fromInsight && !fromSnapshot) {
    return null;
  }
  if (!fromInsight) {
    return fromSnapshot;
  }
  if (!fromSnapshot) {
    return fromInsight;
  }
  if (fromInsight.stepCount >= fromSnapshot.stepCount) {
    return fromInsight;
  }
  return fromSnapshot;
}

async function loadFoodRecords(date: string): Promise<FoodRecord[]> {
  const rawRecords = await AsyncStorage.getItem(FOOD_RECORDS_STORAGE_KEY);
  if (!rawRecords) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawRecords) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(isFoodRecord)
      .filter(record => isSameISODate(record.createdAt, date));
  } catch {
    return [];
  }
}

async function loadStepSummaryFromInsightHistory(
  date: string,
): Promise<StepDaySummary | null> {
  const rawHistory = await AsyncStorage.getItem(
    STEP_INSIGHT_HISTORY_STORAGE_KEY,
  );
  if (!rawHistory) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawHistory) as unknown;
    if (!Array.isArray(parsed)) {
      return null;
    }

    const latestItem = parsed
      .filter(isStepSummaryCandidate)
      .filter(item => isSameISODate(item.createdAt, date))
      .sort(
        (left, right) => toTime(right.createdAt) - toTime(left.createdAt),
      )[0];

    if (!latestItem) {
      return null;
    }

    return {
      date,
      stepCount: latestItem.stepCount,
      goalStepCount: latestItem.goalStepCount,
      progressPercent: calculateProgressPercent(
        latestItem.stepCount,
        latestItem.goalStepCount,
      ),
    };
  } catch {
    return null;
  }
}

async function loadStepSummary(date: string): Promise<StepDaySummary | null> {
  const [fromInsight, fromSnapshot] = await Promise.all([
    loadStepSummaryFromInsightHistory(date),
    getDailyStepSnapshotForDate(date),
  ]);
  return mergeStepSummaries(fromInsight, fromSnapshot);
}

async function canGenerateReport(date: string): Promise<boolean> {
  const summary = await loadStepSummary(date);
  if (!summary) {
    return false;
  }
  return (
    summary.goalStepCount > 0 && summary.stepCount >= summary.goalStepCount
  );
}

type CreateDailyReportDataSourcesOptions = {
  checkReportAccess: () => boolean | Promise<boolean>;
  onReportGeneratedSuccess: () => void | Promise<void>;
};

export function createDailyReportDataSources({
  checkReportAccess,
  onReportGeneratedSuccess,
}: CreateDailyReportDataSourcesOptions): DailyReportDataSources {
  return {
    loadFoodRecords,
    loadStepSummary,
    canGenerateReport,
    checkReportAccess,
    onReportGeneratedSuccess,
  };
}
