import {
  createDailyHealthReport,
  extractFirstJsonObject,
  parseJsonObject,
  type DailyHealthReport,
  type DailyHealthReportInput,
} from '@rn-health/core';
import {
  buildDailyReportPrompt,
  DAILY_REPORT_SYSTEM_PROMPT,
} from '../constants/prompts';
import type {DailyReportGenerationResult} from '../types/dailyReport';
import {generateDailyReportText} from './generateDailyReportText';

const DAILY_REPORT_MODEL = 'gemini-2.5-flash';
const DAILY_REPORT_MAX_INSIGHTS = 4;
const DAILY_REPORT_MIN_INSIGHTS = 2;
const DAILY_REPORT_MAX_TEXT_LENGTH = 240;

const BLOCKED_PHRASES = [
  '진단',
  '질병',
  '치료',
  '위험',
  '문제가 있다',
  '건강하다',
  '복용',
  '혈당',
  '혈압',
];

function normalizeText(value: unknown) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, DAILY_REPORT_MAX_TEXT_LENGTH);
}

function includesBlockedPhrase(value: string) {
  return BLOCKED_PHRASES.some(phrase => value.includes(phrase));
}

function normalizeSummary(value: unknown, fallback: string) {
  const summary = normalizeText(value);
  if (!summary || includesBlockedPhrase(summary)) {
    return fallback;
  }
  return summary;
}

function normalizeInsights(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const insights = value
    .map(normalizeText)
    .filter(text => text.length > 0 && !includesBlockedPhrase(text))
    .slice(0, DAILY_REPORT_MAX_INSIGHTS);

  if (insights.length < DAILY_REPORT_MIN_INSIGHTS) {
    return fallback;
  }

  return insights;
}

function normalizeDailyHealthReport(
  value: unknown,
  fallbackReport: DailyHealthReport,
): DailyHealthReport | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const payload = value as Partial<DailyHealthReport>;
  return {
    date: fallbackReport.date,
    summary: normalizeSummary(payload.summary, fallbackReport.summary),
    nutrition: fallbackReport.nutrition,
    steps: fallbackReport.steps,
    insights: normalizeInsights(payload.insights, fallbackReport.insights),
  };
}

function parseDailyReportResponse(
  rawText: string,
  fallbackReport: DailyHealthReport,
) {
  const jsonString = extractFirstJsonObject(rawText);
  if (!jsonString) {
    return null;
  }

  const parsed = parseJsonObject<unknown>(jsonString);
  if (!parsed) {
    return null;
  }

  return normalizeDailyHealthReport(parsed, fallbackReport);
}

export async function generateDailyReportWithAi(
  input: DailyHealthReportInput,
): Promise<DailyReportGenerationResult> {
  const fallbackReport = createDailyHealthReport(input);

  try {
    const generated = await generateDailyReportText({
      model: DAILY_REPORT_MODEL,
      systemInstruction: DAILY_REPORT_SYSTEM_PROMPT,
      prompt: buildDailyReportPrompt({input, fallbackReport}),
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048,
      },
      timeoutMs: 10_000,
    });

    if (!generated.success) {
      return {
        report: fallbackReport,
        isFallback: true,
      };
    }

    const report = parseDailyReportResponse(generated.text, fallbackReport);
    return {
      report: report ?? fallbackReport,
      isFallback: report === null,
    };
  } catch {
    return {
      report: fallbackReport,
      isFallback: true,
    };
  }
}
