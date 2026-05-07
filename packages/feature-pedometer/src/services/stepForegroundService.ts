import {Platform} from 'react-native';
import {
  startForegroundStepTrackingService as startAndroidForegroundStepTrackingService,
  stopForegroundStepTrackingService as stopAndroidForegroundStepTrackingService,
} from './stepForegroundService.android';
import {
  startForegroundStepTrackingService as startIosForegroundStepTrackingService,
  stopForegroundStepTrackingService as stopIosForegroundStepTrackingService,
} from './stepForegroundService.ios';

export async function startForegroundStepTrackingService() {
  if (Platform.OS === 'android') {
    return startAndroidForegroundStepTrackingService();
  }

  return startIosForegroundStepTrackingService();
}

export async function stopForegroundStepTrackingService() {
  if (Platform.OS === 'android') {
    return stopAndroidForegroundStepTrackingService();
  }

  return stopIosForegroundStepTrackingService();
}
