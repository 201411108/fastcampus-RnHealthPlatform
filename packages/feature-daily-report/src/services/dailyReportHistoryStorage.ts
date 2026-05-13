import AsyncStorage from '@react-native-async-storage/async-storage';
import type {DailyReportHistoryItem} from '../types/dailyReport';

const DAILY_REPORT_HISTORY_STORAGE_KEY = '@dailyReport/history/v1';
const DAILY_REPORT_HISTORY_MAX_ITEMS = 30;

function toTime(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function isValidHistoryItem(value: unknown): value is DailyReportHistoryItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Partial<DailyReportHistoryItem>;
  return (
    typeof item.id === 'string' &&
    typeof item.createdAt === 'string' &&
    !!item.report &&
    typeof item.report.date === 'string' &&
    typeof item.report.summary === 'string' &&
    Array.isArray(item.report.insights)
  );
}

function sanitizeHistory(items: DailyReportHistoryItem[]) {
  return items
    .filter(isValidHistoryItem)
    .sort((left, right) => toTime(right.createdAt) - toTime(left.createdAt))
    .slice(0, DAILY_REPORT_HISTORY_MAX_ITEMS);
}

function parseHistory(rawValue: string | null): DailyReportHistoryItem[] {
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

export async function getDailyReportHistory() {
  try {
    const rawHistory = await AsyncStorage.getItem(DAILY_REPORT_HISTORY_STORAGE_KEY);
    return parseHistory(rawHistory);
  } catch {
    return [];
  }
}

export async function appendDailyReportHistory(item: DailyReportHistoryItem) {
  const previousHistory = await getDailyReportHistory();
  const nextHistory = sanitizeHistory([item, ...previousHistory]);
  await AsyncStorage.setItem(
    DAILY_REPORT_HISTORY_STORAGE_KEY,
    JSON.stringify(nextHistory),
  );
}

export async function clearDailyReportHistory() {
  await AsyncStorage.removeItem(DAILY_REPORT_HISTORY_STORAGE_KEY);
}
