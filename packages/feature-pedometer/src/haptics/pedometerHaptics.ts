import {
  impactAsync,
  ImpactFeedbackStyle,
  notificationAsync,
  NotificationFeedbackType,
  selectionAsync,
} from 'expo-haptics';

export type PedometerHapticEvent =
  | 'trackingStarted'
  | 'trackingStopped'
  | 'goalReached'
  | 'error'
  | 'validationHint'
  | 'retrySuccess'
  | 'retryFailure';

async function runPedometerHapticAsync(
  event: PedometerHapticEvent,
): Promise<void> {
  switch (event) {
    case 'trackingStarted':
      await notificationAsync(NotificationFeedbackType.Success);
      return;
    case 'trackingStopped':
      await impactAsync(ImpactFeedbackStyle.Light);
      return;
    case 'goalReached':
      await notificationAsync(NotificationFeedbackType.Success);
      return;
    case 'error':
      await notificationAsync(NotificationFeedbackType.Error);
      return;
    case 'validationHint':
      await notificationAsync(NotificationFeedbackType.Warning);
      return;
    case 'retrySuccess':
      await selectionAsync();
      return;
    case 'retryFailure':
      await notificationAsync(NotificationFeedbackType.Warning);
      return;
  }
}

/**
 * 햅틱 실패는 호출부 로직에 영향을 주지 않도록 내부에서 삼킵니다.
 */
export function runPedometerHaptic(event: PedometerHapticEvent): void {
  runPedometerHapticAsync(event).catch(() => {});
}
