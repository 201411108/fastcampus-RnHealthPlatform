import { generateTextFromPrompt } from '@rn-health/core';
import {
  STEP_INSIGHT_FIELD_MAX_LENGTH,
  STEP_INSIGHT_SENTENCE_RULE,
  type StepInsightResult,
} from '../types/stepInsight';

const STEP_INSIGHT_MODEL = 'gemini-2.5-flash';

type StepInsightAiInput = {
  stepCount: number;
  goalStepCount: number;
  progressPercent: number;
};

type GenerateStepInsightWithAiResult = {
  data: StepInsightResult;
  isFallback: boolean;
};

type ParsedStepInsightResult = Partial<Record<keyof StepInsightResult, unknown>>;

const STEP_INSIGHT_FALLBACK_RESULT: StepInsightResult = {
  summary: '오늘 걸음 데이터를 바탕으로 요약을 준비하지 못했습니다.',
  insight: '현재 걸음 흐름을 바탕으로 다음 패턴을 분석 중입니다.',
  motivation: '지금처럼 꾸준히 한 걸음씩 이어가면 목표에 더 가까워질 수 있습니다.',
};

function isValidNumber(value: number) {
  return Number.isFinite(value);
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

  if (!joined) {
    return '';
  }

  return joined.slice(0, STEP_INSIGHT_FIELD_MAX_LENGTH).trim();
}

function normalizeInsightResult(payload: ParsedStepInsightResult): StepInsightResult {
  const summary = normalizeFieldText(payload.summary);
  const insight = normalizeFieldText(payload.insight);
  const motivation = normalizeFieldText(payload.motivation);

  return {
    summary: summary || STEP_INSIGHT_FALLBACK_RESULT.summary,
    insight: insight || STEP_INSIGHT_FALLBACK_RESULT.insight,
    motivation: motivation || STEP_INSIGHT_FALLBACK_RESULT.motivation,
  };
}

function parseInsightResponse(rawText: string): StepInsightResult {
  const normalizedText = rawText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const parsed = JSON.parse(normalizedText) as ParsedStepInsightResult;
  return normalizeInsightResult(parsed);
}

function buildPrompt({ stepCount, goalStepCount, progressPercent }: StepInsightAiInput) {
  return [
    '당신은 걸음수 코치입니다.',
    '한국어로만 답변합니다.',
    '반드시 JSON 객체 한 개만 반환하세요.',
    '키는 summary, insight, motivation만 포함하세요.',
    `각 키는 ${STEP_INSIGHT_SENTENCE_RULE.min}~${STEP_INSIGHT_SENTENCE_RULE.max}문장, ${STEP_INSIGHT_FIELD_MAX_LENGTH}자 이하로 작성하세요.`,
    '의료 조언, 과장, 단정 표현은 금지합니다.',
    '사용자 데이터:',
    `- stepCount: ${stepCount}`,
    `- goalStepCount: ${goalStepCount}`,
    `- progressPercent: ${progressPercent.toFixed(1)}%`,
  ].join('\n');
}

export async function generateStepInsightWithAi(
  input: StepInsightAiInput,
): Promise<GenerateStepInsightWithAiResult> {
  const { stepCount, goalStepCount, progressPercent } = input;
  if (
    !isValidNumber(stepCount) ||
    !isValidNumber(goalStepCount) ||
    !isValidNumber(progressPercent) ||
    stepCount < 0 ||
    goalStepCount <= 0 ||
    progressPercent < 0
  ) {
    return {
      data: STEP_INSIGHT_FALLBACK_RESULT,
      isFallback: true,
    };
  }

  try {
    const generated = await generateTextFromPrompt({
      model: STEP_INSIGHT_MODEL,
      prompt: buildPrompt({ stepCount, goalStepCount, progressPercent }),
      timeoutMs: 10_000,
    });

    if (!generated.success) {
      return {
        data: STEP_INSIGHT_FALLBACK_RESULT,
        isFallback: true,
      };
    }

    return {
      data: parseInsightResponse(generated.text),
      isFallback: false,
    };
  } catch {
    return {
      data: STEP_INSIGHT_FALLBACK_RESULT,
      isFallback: true,
    };
  }
}
