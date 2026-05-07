import { Pedometer } from 'expo-sensors';
import { useCallback, useEffect, useRef } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';

type UseStepCounterBackgroundSyncParams = {
  isTracking: boolean;
  sessionStartRef: MutableRefObject<Date | null>;
  setStepCount: Dispatch<SetStateAction<number>>;
  setStatusMessage: Dispatch<SetStateAction<string>>;
  setErrorMessage: Dispatch<SetStateAction<string>>;
};

export function useStepCounterBackgroundSync({
  isTracking,
  sessionStartRef,
  setStepCount,
  setStatusMessage,
  setErrorMessage,
}: UseStepCounterBackgroundSyncParams) {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const syncIosSessionStepCount = useCallback(
    async (sessionStartDate: Date) => {
      const now = new Date();
      const result = await Pedometer.getStepCountAsync(sessionStartDate, now);
      const syncedStepCount = Math.max(0, Math.round(result.steps));

      setStepCount((previous: number) =>
        syncedStepCount > previous ? syncedStepCount : previous,
      );
    },
    [setStepCount],
  );

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    const appStateSubscription = AppState.addEventListener(
      'change',
      nextAppState => {
        const wasBackground =
          appStateRef.current === 'background' ||
          appStateRef.current === 'inactive';
        appStateRef.current = nextAppState;

        if (!wasBackground || nextAppState !== 'active' || !isTracking) {
          return;
        }

        const sessionStartDate = sessionStartRef.current;
        if (!sessionStartDate) {
          return;
        }

        syncIosSessionStepCount(sessionStartDate)
          .then(() => {
            setErrorMessage('');
            setStatusMessage('백그라운드 누적 걸음 수를 반영했습니다.');
          })
          .catch(() => {
            setErrorMessage(
              '백그라운드 걸음 수 동기화에 실패했습니다. 잠시 후 다시 시도해 주세요.',
            );
            setStatusMessage('걸음 수를 추적 중입니다.');
          });
      },
    );

    return () => {
      appStateSubscription.remove();
    };
  }, [
    isTracking,
    sessionStartRef,
    setErrorMessage,
    setStatusMessage,
    syncIosSessionStepCount,
  ]);
}
