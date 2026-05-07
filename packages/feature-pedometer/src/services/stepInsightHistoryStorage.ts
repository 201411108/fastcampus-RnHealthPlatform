import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  STEP_INSIGHT_HISTORY_MAX_ITEMS,
  STEP_INSIGHT_HISTORY_STORAGE_KEY,
  type StepInsightHistoryItem,
} from '../types/stepInsight';

function toTime(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function isValidHistoryItem(value: unknown): value is StepInsightHistoryItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Partial<StepInsightHistoryItem>;
  return (
    typeof item.id === 'string' &&
    typeof item.createdAt === 'string' &&
    typeof item.stepCount === 'number' &&
    Number.isFinite(item.stepCount) &&
    item.stepCount >= 0 &&
    typeof item.goalStepCount === 'number' &&
    Number.isFinite(item.goalStepCount) &&
    item.goalStepCount > 0 &&
    typeof item.progressPercent === 'number' &&
    Number.isFinite(item.progressPercent) &&
    item.progressPercent >= 0 &&
    !!item.result &&
    typeof item.result.summary === 'string' &&
    typeof item.result.insight === 'string' &&
    typeof item.result.motivation === 'string'
  );
}

function sanitizeHistory(items: StepInsightHistoryItem[]) {
  return items
    .filter(isValidHistoryItem)
    .sort((left, right) => toTime(right.createdAt) - toTime(left.createdAt))
    .slice(0, STEP_INSIGHT_HISTORY_MAX_ITEMS);
}

function parseHistory(rawValue: string | null): StepInsightHistoryItem[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return sanitizeHistory(parsed);
  } catch {
    return [];
  }
}

export async function getStepInsightHistory(): Promise<StepInsightHistoryItem[]> {
  try {
    const rawHistory = await AsyncStorage.getItem(
      STEP_INSIGHT_HISTORY_STORAGE_KEY,
    );
    return parseHistory(rawHistory);
  } catch (error) {
    console.warn('인사이트 기록을 불러오지 못했습니다.', error);
    return [];
  }
}

export async function appendStepInsightHistory(item: StepInsightHistoryItem) {
  try {
    const previousHistory = await getStepInsightHistory();
    const nextHistory = sanitizeHistory([item, ...previousHistory]);
    await AsyncStorage.setItem(
      STEP_INSIGHT_HISTORY_STORAGE_KEY,
      JSON.stringify(nextHistory),
    );
  } catch (error) {
    console.warn('인사이트 기록 저장에 실패했습니다.', error);
  }
}

export async function clearStepInsightHistory() {
  try {
    await AsyncStorage.removeItem(STEP_INSIGHT_HISTORY_STORAGE_KEY);
  } catch (error) {
    console.warn('인사이트 기록 삭제에 실패했습니다.', error);
  }
}
