import { useCallback, useEffect, useRef, useState } from 'react';
import { loadAndShowInterstitialForSlot } from '@rn-health/core';
import {
  appendStepInsightHistory,
  getStepInsightHistory,
} from '../services/stepInsightHistoryStorage';
import { generateStepInsightWithAi } from '../services/stepInsightAi';
import {
  EMPTY_STEP_INSIGHT_RESULT,
  type StepInsightHistoryItem,
} from '../types/stepInsight';

type UseStepInsightAutoTriggerParams = {
  isTracking: boolean;
  stepCount: number;
  goalStepCount: number | null;
};

export function useStepInsightAutoTrigger({
  isTracking,
  stepCount,
  goalStepCount,
}: UseStepInsightAutoTriggerParams) {
  const lastRequestedGoalStepCountRef = useRef<number | null>(null);
  const [isGeneratingStepInsight, setIsGeneratingStepInsight] = useState(false);
  const [stepInsightErrorMessage, setStepInsightErrorMessage] = useState('');
  const [stepInsightResult, setStepInsightResult] = useState(EMPTY_STEP_INSIGHT_RESULT);
  const [stepInsightHistory, setStepInsightHistory] = useState<
    StepInsightHistoryItem[]
  >([]);

  const refreshStepInsightHistory = useCallback(async () => {
    const nextHistory = await getStepInsightHistory();
    setStepInsightHistory(nextHistory);
  }, []);

  const requestStepInsight = useCallback(
    async (params: { nextStepCount: number; nextGoalStepCount: number }) => {
      const { nextStepCount, nextGoalStepCount } = params;
      if (nextGoalStepCount <= 0 || nextStepCount < 0) {
        return;
      }

      setIsGeneratingStepInsight(true);
      setStepInsightErrorMessage('');

      const progressPercent = (nextStepCount / nextGoalStepCount) * 100;
      const [result] = await Promise.all([
        generateStepInsightWithAi({
          stepCount: nextStepCount,
          goalStepCount: nextGoalStepCount,
          progressPercent,
        }),
        loadAndShowInterstitialForSlot('pedometer.goalInsightInterstitial'),
      ]);

      setStepInsightResult(result.data);
      if (!result.isFallback) {
        const historyItem: StepInsightHistoryItem = {
          id: `${Date.now()}-${nextStepCount}-${nextGoalStepCount}`,
          createdAt: new Date().toISOString(),
          stepCount: nextStepCount,
          goalStepCount: nextGoalStepCount,
          progressPercent,
          result: result.data,
        };
        await appendStepInsightHistory(historyItem);
        await refreshStepInsightHistory();
      } else {
        setStepInsightErrorMessage(
          'AI 인사이트 생성에 실패했습니다. 다시 시도해 주세요.',
        );
      }
      setIsGeneratingStepInsight(false);
    },
    [refreshStepInsightHistory],
  );

  const resetStepInsightAutoTrigger = useCallback(() => {
    lastRequestedGoalStepCountRef.current = null;
    setStepInsightResult(EMPTY_STEP_INSIGHT_RESULT);
    setStepInsightErrorMessage('');
    setIsGeneratingStepInsight(false);
  }, []);

  const regenerateStepInsight = useCallback(() => {
    if (!isTracking || !goalStepCount || goalStepCount <= 0) {
      setStepInsightErrorMessage(
        '목표 걸음수를 설정하고 추적을 시작해 주세요.',
      );
      return;
    }

    requestStepInsight({
      nextStepCount: stepCount,
      nextGoalStepCount: goalStepCount,
    });
  }, [goalStepCount, isTracking, requestStepInsight, stepCount]);

  useEffect(() => {
    refreshStepInsightHistory();
  }, [refreshStepInsightHistory]);

  useEffect(() => {
    if (!isTracking || !goalStepCount || goalStepCount <= 0) {
      return;
    }
    if (stepCount < goalStepCount) {
      return;
    }
    if (lastRequestedGoalStepCountRef.current === goalStepCount) {
      return;
    }

    lastRequestedGoalStepCountRef.current = goalStepCount;
    requestStepInsight({
      nextStepCount: stepCount,
      nextGoalStepCount: goalStepCount,
    });
  }, [goalStepCount, isTracking, requestStepInsight, stepCount]);

  return {
    isGeneratingStepInsight,
    stepInsightErrorMessage,
    stepInsightResult,
    stepInsightHistory,
    refreshStepInsightHistory,
    regenerateStepInsight,
    resetStepInsightAutoTrigger,
  };
}
