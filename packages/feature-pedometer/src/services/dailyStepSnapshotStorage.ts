import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateProgressPercent, type StepDaySummary } from '@rn-health/core';

const DAILY_STEP_SNAPSHOT_STORAGE_KEY = '@pedometer/dailyStepSnapshot/v1';

export type DailyStepSnapshot = {
  date: string;
  stepCount: number;
  goalStepCount: number;
  updatedAt: string;
};

type SnapshotMap = Record<string, DailyStepSnapshot>;

function parseSnapshotMap(raw: string | null): SnapshotMap {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }
    return parsed as SnapshotMap;
  } catch {
    return {};
  }
}

/**
 * Daily Report·주간 요약에서 오늘 걸음/목표를 읽을 수 있도록 날짜별 스냅샷을 저장합니다.
 */
export async function saveDailyStepSnapshot(params: {
  date: string;
  stepCount: number;
  goalStepCount: number;
}): Promise<void> {
  const { date, stepCount, goalStepCount } = params;
  if (!date || goalStepCount <= 0) {
    return;
  }

  const raw = await AsyncStorage.getItem(DAILY_STEP_SNAPSHOT_STORAGE_KEY);
  const map = parseSnapshotMap(raw);
  map[date] = {
    date,
    stepCount,
    goalStepCount,
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(
    DAILY_STEP_SNAPSHOT_STORAGE_KEY,
    JSON.stringify(map),
  );
}

export async function getDailyStepSnapshotForDate(
  date: string,
): Promise<StepDaySummary | null> {
  const raw = await AsyncStorage.getItem(DAILY_STEP_SNAPSHOT_STORAGE_KEY);
  const map = parseSnapshotMap(raw);
  const snap = map[date];
  if (!snap) {
    return null;
  }

  return {
    date: snap.date,
    stepCount: snap.stepCount,
    goalStepCount: snap.goalStepCount,
    progressPercent: calculateProgressPercent(
      snap.stepCount,
      snap.goalStepCount,
    ),
  };
}
