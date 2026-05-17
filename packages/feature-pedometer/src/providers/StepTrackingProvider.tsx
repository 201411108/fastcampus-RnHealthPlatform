import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {toISODate} from '@rn-health/core';
import {runPedometerHaptic} from '../haptics/pedometerHaptics';
import {createExpoStepSensor} from '../sensor/expoStepSensor';
import type {StepSensorPort} from '../sensor/types';
import {useStepCounterBackgroundSync} from '../hooks/useStepCounterBackgroundSync';
import {
  startForegroundStepTrackingService,
  stopForegroundStepTrackingService,
} from '../services/stepForegroundService';
import {saveDailyStepSnapshot} from '../services/dailyStepSnapshotStorage';
import {ensureBackgroundStepPermissions} from '../utils/activityRecognition';
import {useStepInsightAutoTrigger} from '../hooks/useStepInsightAutoTrigger';
import type {
  StepInsightHistoryItem,
  StepInsightResult,
} from '../types/stepInsight';

export type StepTrackingContextValue = {
  goalStepCount: number | null;
  setGoalStepCount: (goalStepCount: number) => void;
  stepCount: number;
  isTracking: boolean;
  isProcessing: boolean;
  statusMessage: string;
  errorMessage: string;
  isDeviceUnsupported: boolean;
  isStartDisabled: boolean;
  handleTrackingButtonPress: () => Promise<void>;
  isGeneratingStepInsight: boolean;
  stepInsightErrorMessage: string;
  stepInsightResult: StepInsightResult;
  stepInsightHistory: StepInsightHistoryItem[];
  refreshStepInsightHistory: () => Promise<void>;
  showGoalAchievementInsightCta: boolean;
  canRegenerateStepInsightWithAd: boolean;
  requestGoalInsightFromUser: () => void;
  requestStepInsightWithAd: (
    params: { nextStepCount: number; nextGoalStepCount: number },
    options?: { playAiResultHaptic?: boolean },
  ) => Promise<void>;
};

const StepTrackingContext = createContext<StepTrackingContextValue | null>(
  null,
);

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return '걸음 수를 추적하는 중 오류가 발생했습니다.';
}

function getPermissionName(permission: string) {
  if (permission === 'activityRecognition') {
    return '활동 인식';
  }
  if (permission === 'motion') {
    return '모션 및 피트니스';
  }
  if (permission === 'notifications') {
    return '알림';
  }
  return permission;
}

function getPermissionErrorMessage(
  status: 'denied' | 'blocked',
  missingPermissions: string[],
) {
  const permissionNames = missingPermissions.map(getPermissionName).join(', ');
  if (status === 'blocked') {
    return `${permissionNames} 권한이 차단되어 있어 설정에서 직접 허용해야 합니다.`;
  }

  return `${permissionNames} 권한이 허용되어야 추적을 시작할 수 있습니다.`;
}

type StepTrackingProviderProps = {
  children: ReactNode;
  stepSensor?: StepSensorPort;
};

export function StepTrackingProvider({
  children,
  stepSensor: stepSensorProp,
}: StepTrackingProviderProps) {
  const stepSensorRef = useRef<StepSensorPort | null>(null);
  if (stepSensorRef.current == null) {
    stepSensorRef.current = stepSensorProp ?? createExpoStepSensor();
  }
  const stepSensor = stepSensorRef.current;

  const subscriptionRef = useRef<ReturnType<
    StepSensorPort['subscribeFromSessionStart']
  > | null>(null);
  const sessionStartRef = useRef<Date | null>(null);
  const [goalStepCount, setGoalStepCountState] = useState<number | null>(null);
  const [stepCount, setStepCount] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('추적을 시작해 주세요.');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDeviceUnsupported, setIsDeviceUnsupported] = useState(false);
  const hasGoalConfigured = goalStepCount !== null;

  useStepCounterBackgroundSync({
    isTracking,
    sessionStartRef,
    setStepCount,
    setStatusMessage,
    setErrorMessage,
  });

  useEffect(() => {
    if (goalStepCount === null || goalStepCount <= 0) {
      return;
    }
    saveDailyStepSnapshot({
      date: toISODate(new Date()),
      stepCount,
      goalStepCount,
    }).catch(() => {});
  }, [goalStepCount, stepCount]);

  const {
    isGeneratingStepInsight,
    stepInsightErrorMessage,
    stepInsightResult,
    stepInsightHistory,
    refreshStepInsightHistory,
    requestGoalInsightFromUser,
    requestStepInsightWithAd,
    showGoalAchievementInsightCta,
    canRegenerateStepInsightWithAd,
    resetStepInsightAutoTrigger,
  } = useStepInsightAutoTrigger({
    stepCount,
    goalStepCount,
  });

  const setGoalStepCount = useCallback((nextGoalStepCount: number) => {
    setGoalStepCountState(nextGoalStepCount);
  }, []);

  const startStepUpdateSession = useCallback(
    (sessionStartDate: Date, options?: {resetCount?: boolean}) => {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      stepSensor.stopAll();

      if (options?.resetCount) {
        setStepCount(0);
      }

      subscriptionRef.current = stepSensor.subscribeFromSessionStart(
        sessionStartDate,
        nextSteps => {
          setStepCount(nextSteps);
        },
      );
    },
    [stepSensor],
  );

  const stopTracking = useCallback(
    (nextStatusMessage: string) => {
      runPedometerHaptic('trackingStopped');
      stopForegroundStepTrackingService().catch(() => {});
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      stepSensor.stopAll();
      sessionStartRef.current = null;
      setIsTracking(false);
      setStatusMessage(nextStatusMessage);
    },
    [stepSensor],
  );

  const startTracking = useCallback(async () => {
    if (isTracking || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    setIsDeviceUnsupported(false);
    let isAndroidForegroundServiceStarted = false;

    try {
      const permissionResult = await ensureBackgroundStepPermissions();
      if (permissionResult.status !== 'granted') {
        runPedometerHaptic('error');
        setErrorMessage(
          getPermissionErrorMessage(
            permissionResult.status,
            permissionResult.missingPermissions,
          ),
        );
        return;
      }

      const supportResult = await stepSensor.checkSupport();
      if (!supportResult.supported) {
        runPedometerHaptic('error');
        setIsDeviceUnsupported(true);
        setErrorMessage('이 기기에서는 걸음 수 추적을 지원하지 않습니다.');
        return;
      }

      if (!supportResult.granted) {
        runPedometerHaptic('error');
        setErrorMessage(
          '걸음 수 권한이 허용되지 않아 추적을 시작할 수 없습니다.',
        );
        return;
      }

      await startForegroundStepTrackingService();
      isAndroidForegroundServiceStarted = true;

      const sessionStartDate = new Date();
      sessionStartRef.current = sessionStartDate;
      resetStepInsightAutoTrigger();
      startStepUpdateSession(sessionStartDate, {resetCount: true});

      setIsTracking(true);
      setStatusMessage('걸음 수를 추적 중입니다.');
      runPedometerHaptic('trackingStarted');
    } catch (error) {
      if (isAndroidForegroundServiceStarted) {
        stopForegroundStepTrackingService().catch(() => {});
      }
      runPedometerHaptic('error');
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  }, [
    isProcessing,
    isTracking,
    resetStepInsightAutoTrigger,
    startStepUpdateSession,
    stepSensor,
  ]);

  const handleTrackingButtonPress = useCallback(async () => {
    if (isTracking) {
      stopTracking('추적이 중지되었습니다.');
      return;
    }

    if (!hasGoalConfigured) {
      runPedometerHaptic('validationHint');
      setErrorMessage('목표 걸음수를 먼저 설정해 주세요.');
      setStatusMessage('목표 설정 후 추적을 시작할 수 있습니다.');
      return;
    }

    await startTracking();
  }, [hasGoalConfigured, isTracking, startTracking, stopTracking]);

  const isStartDisabled =
    !isTracking && (!hasGoalConfigured || isProcessing);
  useEffect(() => {
    return () => {
      stopForegroundStepTrackingService().catch(() => {});
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      stepSensor.stopAll();
    };
  }, [stepSensor]);

  const contextValue = useMemo<StepTrackingContextValue>(
    () => ({
      goalStepCount,
      setGoalStepCount,
      stepCount,
      isTracking,
      isProcessing,
      statusMessage,
      errorMessage,
      isDeviceUnsupported,
      isStartDisabled,
      handleTrackingButtonPress,
      isGeneratingStepInsight,
      stepInsightErrorMessage,
      stepInsightResult,
      stepInsightHistory,
      refreshStepInsightHistory,
      requestGoalInsightFromUser,
      requestStepInsightWithAd,
      showGoalAchievementInsightCta,
      canRegenerateStepInsightWithAd,
    }),
    [
      canRegenerateStepInsightWithAd,
      errorMessage,
      goalStepCount,
      handleTrackingButtonPress,
      isDeviceUnsupported,
      isGeneratingStepInsight,
      isProcessing,
      isStartDisabled,
      isTracking,
      refreshStepInsightHistory,
      requestGoalInsightFromUser,
      requestStepInsightWithAd,
      setGoalStepCount,
      showGoalAchievementInsightCta,
      statusMessage,
      stepCount,
      stepInsightErrorMessage,
      stepInsightHistory,
      stepInsightResult,
    ],
  );

  return (
    <StepTrackingContext.Provider value={contextValue}>
      {children}
    </StepTrackingContext.Provider>
  );
}

export function useStepTrackingContext() {
  const context = useContext(StepTrackingContext);
  if (!context) {
    throw new Error(
      'useStepTrackingContext는 StepTrackingProvider 내부에서 사용해야 합니다.',
    );
  }
  return context;
}
