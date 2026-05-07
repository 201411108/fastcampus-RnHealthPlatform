export type StepSensorSupportResult = {
  supported: boolean;
  granted: boolean;
};

export type StepSensorSubscription = {
  remove: () => void;
};

/**
 * 걸음 데이터 소스 추상화. 구현체는 `createExpoStepSensor` 등.
 */
export type StepSensorPort = {
  checkSupport: () => Promise<StepSensorSupportResult>;
  subscribeFromSessionStart: (
    sessionStart: Date,
    onSteps: (steps: number) => void,
  ) => StepSensorSubscription;
  stopAll: () => void;
};
