export type StepInsightResult = {
  summary: string;
  insight: string;
  motivation: string;
};

export type StepInsightHistoryItem = {
  id: string;
  createdAt: string;
  stepCount: number;
  goalStepCount: number;
  progressPercent: number;
  result: StepInsightResult;
};

export const STEP_INSIGHT_SENTENCE_RULE = {
  min: 1,
  max: 3,
} as const;

export const STEP_INSIGHT_FIELD_MAX_LENGTH = 300;
export const STEP_INSIGHT_HISTORY_STORAGE_KEY = '@stepInsight/history/v1';
export const STEP_INSIGHT_HISTORY_MAX_ITEMS = 50;

export const EMPTY_STEP_INSIGHT_RESULT: StepInsightResult = {
  summary: '',
  insight: '',
  motivation: '',
};
