import type {FoodAnalysisResult} from '../types/nutrition';
import {
  STEP_INSIGHT_FIELD_MAX_LENGTH,
  STEP_INSIGHT_SENTENCE_RULE,
  type StepInsightResult,
} from '../types/stepInsight';

const STEP_INSIGHT_FALLBACK_RESULT: StepInsightResult = {
  summary: '오늘 걸음 데이터를 바탕으로 요약을 준비하지 못했습니다.',
  insight: '현재 걸음 흐름을 바탕으로 다음 패턴을 분석 중입니다.',
  motivation: '지금처럼 꾸준히 한 걸음씩 이어가면 목표에 더 가까워질 수 있습니다.',
};

type ParsedStepInsightResult = Partial<Record<keyof StepInsightResult, unknown>>;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizeFieldText(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const sentenceMatches =
    trimmed.match(/[^.!?]+[.!?]+/g) ?? (trimmed.length > 0 ? [trimmed] : []);
  const limitedSentences = sentenceMatches.slice(0, STEP_INSIGHT_SENTENCE_RULE.max);
  const joined = limitedSentences.join(' ').trim();

  return joined.slice(0, STEP_INSIGHT_FIELD_MAX_LENGTH).trim();
}

export function stripJsonCodeFence(text: string): string {
  return text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

export function extractFirstJsonObject(text: string): string | null {
  const cleanText = stripJsonCodeFence(text);
  const startIndex = cleanText.indexOf('{');
  if (startIndex < 0) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = startIndex; index < cleanText.length; index += 1) {
    const char = cleanText[index];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }
    if (char === '\\') {
      isEscaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (char === '{') {
      depth += 1;
    }
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return cleanText.slice(startIndex, index + 1);
      }
    }
  }

  return null;
}

export function parseJsonObject<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function normalizeFoodAnalysisResult(
  value: unknown,
): FoodAnalysisResult | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const payload = value as Partial<FoodAnalysisResult>;
  if (typeof payload.food_name !== 'string' || !payload.food_name.trim()) {
    return null;
  }
  if (!isFiniteNumber(payload.calories)) {
    return null;
  }

  const nutrition = payload.nutrition ?? {protein: 0, carbs: 0, fat: 0};
  return {
    food_name: payload.food_name,
    calories: payload.calories,
    nutrition: {
      protein: isFiniteNumber(nutrition.protein) ? nutrition.protein : 0,
      carbs: isFiniteNumber(nutrition.carbs) ? nutrition.carbs : 0,
      fat: isFiniteNumber(nutrition.fat) ? nutrition.fat : 0,
    },
    confidence: isFiniteNumber(payload.confidence) ? payload.confidence : 0,
  };
}

export function normalizeStepInsightResult(value: unknown): StepInsightResult {
  const payload =
    value && typeof value === 'object'
      ? (value as ParsedStepInsightResult)
      : {};
  const summary = normalizeFieldText(payload.summary);
  const insight = normalizeFieldText(payload.insight);
  const motivation = normalizeFieldText(payload.motivation);

  return {
    summary: summary || STEP_INSIGHT_FALLBACK_RESULT.summary,
    insight: insight || STEP_INSIGHT_FALLBACK_RESULT.insight,
    motivation: motivation || STEP_INSIGHT_FALLBACK_RESULT.motivation,
  };
}
