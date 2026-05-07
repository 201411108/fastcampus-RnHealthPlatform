import {Platform} from 'react-native';
import notifee, {AuthorizationStatus} from '@notifee/react-native';
import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions';

type StepSensorPermissionStatus =
  | 'granted'
  | 'denied'
  | 'blocked'
  | 'unavailable';
type NotificationPermissionStatus = 'granted' | 'denied' | 'blocked';
type MissingPermission = 'activityRecognition' | 'motion' | 'notifications';

export type BackgroundStepPermissionResult = {
  status: 'granted' | 'denied' | 'blocked';
  missingPermissions: MissingPermission[];
};

function getStepSensorPermission() {
  if (Platform.OS === 'android') {
    return PERMISSIONS.ANDROID.ACTIVITY_RECOGNITION;
  }

  if (Platform.OS === 'ios') {
    return PERMISSIONS.IOS.MOTION;
  }

  return null;
}

function mapPermissionResultToStatus(
  status: string,
): StepSensorPermissionStatus {
  if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
    return 'granted';
  }
  if (status === RESULTS.BLOCKED) {
    return 'blocked';
  }
  if (status === RESULTS.UNAVAILABLE) {
    return 'unavailable';
  }

  return 'denied';
}

function isNotificationAuthorized(status: AuthorizationStatus) {
  return (
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL
  );
}

export async function checkStepSensorPermissionStatus(): Promise<StepSensorPermissionStatus> {
  const permission = getStepSensorPermission();
  if (!permission) {
    return 'unavailable';
  }

  const status = await check(permission);
  return mapPermissionResultToStatus(status);
}

export async function ensureStepSensorPermissionStatus(): Promise<StepSensorPermissionStatus> {
  const permission = getStepSensorPermission();
  if (!permission) {
    return 'unavailable';
  }

  const currentStatus = await checkStepSensorPermissionStatus();
  if (currentStatus === 'granted' || currentStatus === 'unavailable') {
    return currentStatus;
  }
  if (currentStatus === 'blocked') {
    return 'blocked';
  }

  const requestedStatus = await request(permission);
  return mapPermissionResultToStatus(requestedStatus);
}

async function ensureNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  const currentSettings = await notifee.getNotificationSettings();
  if (isNotificationAuthorized(currentSettings.authorizationStatus)) {
    return 'granted';
  }

  const requestedSettings = await notifee.requestPermission();
  if (isNotificationAuthorized(requestedSettings.authorizationStatus)) {
    return 'granted';
  }

  if (currentSettings.authorizationStatus === AuthorizationStatus.DENIED) {
    return 'blocked';
  }

  return 'denied';
}

export async function ensureBackgroundStepPermissions(): Promise<BackgroundStepPermissionResult> {
  const missingPermissions: MissingPermission[] = [];
  let hasBlockedPermission = false;

  const stepSensorStatus = await ensureStepSensorPermissionStatus();
  if (stepSensorStatus !== 'granted' && stepSensorStatus !== 'unavailable') {
    if (Platform.OS === 'android') {
      missingPermissions.push('activityRecognition');
    } else if (Platform.OS === 'ios') {
      missingPermissions.push('motion');
    }
    hasBlockedPermission = stepSensorStatus === 'blocked';
  }

  const notificationStatus = await ensureNotificationPermissionStatus();
  if (notificationStatus !== 'granted') {
    missingPermissions.push('notifications');
    hasBlockedPermission =
      hasBlockedPermission || notificationStatus === 'blocked';
  }

  if (missingPermissions.length === 0) {
    return {
      status: 'granted',
      missingPermissions,
    };
  }

  return {
    status: hasBlockedPermission ? 'blocked' : 'denied',
    missingPermissions,
  };
}

export async function ensureStepSensorPermission() {
  const status = await ensureStepSensorPermissionStatus();
  return status === 'granted' || status === 'unavailable';
}
