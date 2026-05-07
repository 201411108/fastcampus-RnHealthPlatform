import notifee, {
  AndroidForegroundServiceType,
  AndroidImportance,
  AndroidVisibility,
} from '@notifee/react-native';

const STEP_TRACKING_CHANNEL_ID = 'step-tracking';
const STEP_TRACKING_NOTIFICATION_ID = 'step-tracking-foreground';

export async function startForegroundStepTrackingService() {
  const channelId = await notifee.createChannel({
    id: STEP_TRACKING_CHANNEL_ID,
    name: '걸음 수 추적',
    importance: AndroidImportance.LOW,
    vibration: false,
    sound: undefined,
  });

  await notifee.displayNotification({
    id: STEP_TRACKING_NOTIFICATION_ID,
    title: '걸음 수 추적 중',
    body: '백그라운드에서도 걸음 수를 측정하고 있습니다.',
    android: {
      channelId,
      asForegroundService: true,
      ongoing: true,
      autoCancel: false,
      pressAction: {
        id: 'open-step-tracker',
      },
      visibility: AndroidVisibility.PUBLIC,
      foregroundServiceTypes: [
        AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_HEALTH,
      ],
    },
  });
}

export async function stopForegroundStepTrackingService() {
  await notifee.stopForegroundService();
}
