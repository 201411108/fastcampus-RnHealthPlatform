import { useCallback, useEffect, useRef, useState } from 'react';
import {
  calculateProgressPercent,
  loadAndShowInterstitialForSlot,
} from '@rn-health/core';
import { runPedometerHaptic } from '../haptics/pedometerHaptics';
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
  stepCount: number;
  goalStepCount: number | null;
};

/**
 * 목표 달성 후 AI 인사이트는 전면 광고를 시청한 뒤에만 생성됩니다.
 * 자동 실행 없이 사용자가 명시적으로 요청해야 합니다.
 */
export function useStepInsightAutoTrigger({
  stepCount,
  goalStepCount,
}: UseStepInsightAutoTriggerParams) {
  /** 현재 목표에 대해 광고+인사이트 흐름을 한 번 이상 성공적으로 마쳤을 때 goal 값 */
  const [insightUnlockedGoalKey, setInsightUnlockedGoalKey] = useState<
    number | null
  >(null);
  const goalCelebrationKeyRef = useRef<number | null>(null);

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

  useEffect(() => {
    goalCelebrationKeyRef.current = null;
    setInsightUnlockedGoalKey(null);
  }, [goalStepCount]);

  useEffect(() => {
    if (!goalStepCount || goalStepCount <= 0) {
      return;
    }
    if (stepCount < goalStepCount) {
      return;
    }
    if (goalCelebrationKeyRef.current === goalStepCount) {
      return;
    }
    goalCelebrationKeyRef.current = goalStepCount;
    runPedometerHaptic('goalReached');
  }, [goalStepCount, stepCount]);

  const requestStepInsightWithAd = useCallback(
    async (
      params: { nextStepCount: number; nextGoalStepCount: number },
      options?: { playAiResultHaptic?: boolean },
    ) => {
      const { nextStepCount, nextGoalStepCount } = params;
      const playAiResultHaptic = options?.playAiResultHaptic === true;
      if (nextGoalStepCount <= 0 || nextStepCount < 0) {
        return;
      }

      setIsGeneratingStepInsight(true);
      setStepInsightErrorMessage('');

      const progressPercent = calculateProgressPercent(
        nextStepCount,
        nextGoalStepCount,
      );

      await loadAndShowInterstitialForSlot('pedometer.goalInsightInterstitial');

      const result = await generateStepInsightWithAi({
        stepCount: nextStepCount,
        goalStepCount: nextGoalStepCount,
        progressPercent,
      });

      setStepInsightResult(result.data);
      if (!result.isFallback) {
        setInsightUnlockedGoalKey(nextGoalStepCount);
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
        if (playAiResultHaptic) {
          runPedometerHaptic('retrySuccess');
        }
      } else {
        setStepInsightErrorMessage(
          'AI 인사이트 생성에 실패했습니다. 다시 시도해 주세요.',
        );
        if (playAiResultHaptic) {
          runPedometerHaptic('retryFailure');
        }
      }
      setIsGeneratingStepInsight(false);
    },
    [refreshStepInsightHistory],
  );

  const resetStepInsightAutoTrigger = useCallback(() => {
    goalCelebrationKeyRef.current = null;
    setInsightUnlockedGoalKey(null);
    setStepInsightResult(EMPTY_STEP_INSIGHT_RESULT);
    setStepInsightErrorMessage('');
    setIsGeneratingStepInsight(false);
  }, []);

  const requestGoalInsightFromUser = useCallback(() => {
    if (goalStepCount === null || goalStepCount <= 0) {
      setStepInsightErrorMessage('목표 걸음수를 먼저 설정해 주세요.');
      return;
    }
    if (stepCount < goalStepCount) {
      setStepInsightErrorMessage(
        '목표 걸음수에 도달한 뒤에 이용할 수 있어요.',
      );
      return;
    }

    requestStepInsightWithAd(
      {
        nextStepCount: stepCount,
        nextGoalStepCount: goalStepCount,
      },
      { playAiResultHaptic: true },
    );
    }, [goalStepCount, requestStepInsightWithAd, stepCount]);

  useEffect(() => {
    refreshStepInsightHistory();
  }, [refreshStepInsightHistory]);

  const goalMet =
    goalStepCount !== null &&
    goalStepCount > 0 &&
    stepCount >= goalStepCount;

  const showGoalAchievementInsightCta =
    goalMet && insightUnlockedGoalKey !== goalStepCount;

  const canRegenerateStepInsightWithAd =
    goalMet && insightUnlockedGoalKey === goalStepCount;

  return {
    isGeneratingStepInsight,
    stepInsightErrorMessage,
    stepInsightResult,
    stepInsightHistory,
    refreshStepInsightHistory,
    requestStepInsightWithAd,
    requestGoalInsightFromUser,
    showGoalAchievementInsightCta,
    canRegenerateStepInsightWithAd,
    resetStepInsightAutoTrigger,
  };
}
