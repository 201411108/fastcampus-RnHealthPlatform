import { PermissionStatus } from 'expo-modules-core';
import { Pedometer } from 'expo-sensors';
import type { StepSensorPort, StepSensorSubscription } from './types';

let activeWatchSubscription: { remove: () => void } | null = null;

async function ensurePedometerPermissionGranted(): Promise<boolean> {
  let permission = await Pedometer.getPermissionsAsync();
  if (permission.granted) {
    return true;
  }
  if (
    permission.status === PermissionStatus.UNDETERMINED ||
    permission.canAskAgain
  ) {
    permission = await Pedometer.requestPermissionsAsync();
  }
  return permission.granted;
}

export function createExpoStepSensor(): StepSensorPort {
  return {
    checkSupport: async () => {
      const supported = await Pedometer.isAvailableAsync();
      if (!supported) {
        return { supported: false, granted: false };
      }
      const granted = await ensurePedometerPermissionGranted();
      return { supported: true, granted };
    },

    subscribeFromSessionStart: (
      _sessionStart: Date,
      onSteps: (steps: number) => void,
    ): StepSensorSubscription => {
      activeWatchSubscription?.remove();
      activeWatchSubscription = null;

      const subscription = Pedometer.watchStepCount(result => {
        onSteps(Math.max(0, Math.round(result.steps)));
      });
      activeWatchSubscription = subscription;

      return {
        remove: () => {
          subscription.remove();
          if (activeWatchSubscription === subscription) {
            activeWatchSubscription = null;
          }
        },
      };
    },

    stopAll: () => {
      activeWatchSubscription?.remove();
      activeWatchSubscription = null;
    },
  };
}
