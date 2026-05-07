import type {StepCountData} from '@dongminyu/react-native-step-counter';
import {useCallback, useEffect, useRef} from 'react';
import type {Dispatch, MutableRefObject, SetStateAction} from 'react';
import {
  AppState,
  type AppStateStatus,
  NativeModules,
  Platform,
} from 'react-native';

type StepCounterQueryNativeModule = {
  queryStepCounterDataBetweenDates?: (
    startDate: Date,
    endDate: Date,
    handler: (error: string | null, data: StepCountData | null) => void,
  ) => void;
};

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
      const nativeModule = NativeModules.StepCounter as
        | StepCounterQueryNativeModule
        | undefined;
      const queryStepCounterDataBetweenDates =
        nativeModule?.queryStepCounterDataBetweenDates;
      if (!queryStepCounterDataBetweenDates) {
        return;
      }

      const now = new Date();
      const syncedStepCount = await new Promise<number>((resolve, reject) => {
        queryStepCounterDataBetweenDates(
          sessionStartDate,
          now,
          (error, data) => {
            if (error) {
              reject(new Error(error));
              return;
            }

            resolve(Math.max(0, Math.round(data?.steps ?? 0)));
          },
        );
      });

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
