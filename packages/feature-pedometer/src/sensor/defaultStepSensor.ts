import {
  isStepCountingSupported,
  startStepCounterUpdate,
  stopStepCounterUpdate,
  type StepCountData,
} from '@dongminyu/react-native-step-counter';
import type { StepSensorPort, StepSensorSubscription } from './types';

export function createDefaultStepSensor(): StepSensorPort {
  return {
    checkSupport: () => isStepCountingSupported(),
    subscribeFromSessionStart: (
      sessionStart: Date,
      onSteps: (steps: number) => void,
    ): StepSensorSubscription => {
      stopStepCounterUpdate();
      const subscription = startStepCounterUpdate(
        sessionStart,
        (data: StepCountData) => {
          onSteps(data.steps);
        },
      );
      return {
        remove: () => {
          subscription.remove();
          stopStepCounterUpdate();
        },
      };
    },
    stopAll: () => {
      stopStepCounterUpdate();
    },
  };
}
