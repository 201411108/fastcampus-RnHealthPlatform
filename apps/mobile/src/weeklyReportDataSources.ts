import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  calculateProgressPercent,
  getWeekISODatesFromMonday,
  isValidISODate,
  sumFoodNutrition,
  toISODate,
  type FoodRecord,
  type StepDaySummary,
} from '@rn-health/core';
import type {
  WeeklyReportDataSources,
  WeeklyReportDayPoint,
} from '@rn-health/feature-daily-report';
import { getDailyStepSnapshotForDate } from '@rn-health/feature-pedometer';

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

type StepHistoryCandidate = {
  createdAt: string;
  stepCount: number;
  goalStepCount: number;
};

function isStepHistoryCandidate(value: unknown): value is StepHistoryCandidate {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Partial<StepHistoryCandidate>;
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

function buildStepSummaryMap(
  rawHistory: string | null,
  dates: string[],
): Map<string, StepDaySummary> {
  const latestByDate = new Map<string, StepHistoryCandidate>();

  if (!rawHistory) {
    return new Map();
  }

  try {
    const parsed = JSON.parse(rawHistory) as unknown;
    if (!Array.isArray(parsed)) {
      return new Map();
    }

    const dateSet = new Set(dates);

    for (const item of parsed) {
      if (!isStepHistoryCandidate(item)) {
        continue;
      }
      const timestamp = Date.parse(item.createdAt);
      if (!Number.isFinite(timestamp)) {
        continue;
      }
      const dayISO = toISODate(new Date(timestamp));
      if (!dateSet.has(dayISO)) {
        continue;
      }

      const prev = latestByDate.get(dayISO);
      if (!prev || toTime(item.createdAt) > toTime(prev.createdAt)) {
        latestByDate.set(dayISO, item);
      }
    }
  } catch {
    return new Map();
  }

  const summaries = new Map<string, StepDaySummary>();
  for (const date of dates) {
    const latest = latestByDate.get(date);
    if (latest) {
      summaries.set(date, {
        date,
        stepCount: latest.stepCount,
        goalStepCount: latest.goalStepCount,
        progressPercent: calculateProgressPercent(
          latest.stepCount,
          latest.goalStepCount,
        ),
      });
    }
  }

  return summaries;
}

async function loadWeekSeries(
  mondayISO: string,
): Promise<WeeklyReportDayPoint[]> {
  if (!isValidISODate(mondayISO)) {
    return [];
  }

  const dates = getWeekISODatesFromMonday(mondayISO);

  const [rawFood, rawStep] = await Promise.all([
    AsyncStorage.getItem(FOOD_RECORDS_STORAGE_KEY),
    AsyncStorage.getItem(STEP_INSIGHT_HISTORY_STORAGE_KEY),
  ]);

  let allFood: FoodRecord[] = [];
  if (rawFood) {
    try {
      const parsed = JSON.parse(rawFood) as unknown;
      if (Array.isArray(parsed)) {
        allFood = parsed.filter(isFoodRecord);
      }
    } catch {
      allFood = [];
    }
  }

  const insightByDate = buildStepSummaryMap(rawStep, dates);

  const snapshotSummaries = await Promise.all(
    dates.map(day => getDailyStepSnapshotForDate(day)),
  );

  const stepByDate = new Map<string, StepDaySummary>();
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const merged = mergeStepSummaries(
      insightByDate.get(date) ?? null,
      snapshotSummaries[i],
    );
    if (merged) {
      stepByDate.set(date, merged);
    }
  }

  return dates.map(date => {
    const records = allFood.filter(record =>
      isSameISODate(record.createdAt, date),
    );
    return {
      date,
      nutrition: sumFoodNutrition(records),
      foodRecordCount: records.length,
      stepSummary: stepByDate.get(date) ?? null,
    };
  });
}

export const weeklyReportDataSources: WeeklyReportDataSources = {
  loadWeekSeries,
};
