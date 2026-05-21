const appJson = require('./app.json');

const APP_VERSION = process.env.APP_VERSION?.trim() || '1.0.0';
const EXPO_UPDATE_CHANNEL =
  process.env.EXPO_UPDATE_CHANNEL?.trim() || 'staging';

function resolveEasProjectId() {
  const fromEnv = process.env.EAS_PROJECT_ID?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  try {
    const local = require('./eas.project.json');
    const projectId = local?.projectId?.trim();
    if (projectId && !projectId.startsWith('YOUR_')) {
      return projectId;
    }
  } catch {
    // eas.project.json is optional until `eas init`
  }

  return null;
}

const easProjectId = resolveEasProjectId();
const updatesConfigured = Boolean(easProjectId);

/** @type {import('expo/config').ExpoConfig} */
const expoConfig = {
  name: appJson.displayName || 'HealthAI',
  slug: 'health-ai',
  version: APP_VERSION,
  runtimeVersion: {
    policy: 'appVersion',
  },
  ios: {
    bundleIdentifier: 'com.hankim.healthai',
  },
  android: {
    package: 'com.hankim.healthai',
  },
  plugins: ['expo-updates'],
  extra: easProjectId
    ? {
        eas: {
          projectId: easProjectId,
        },
      }
    : {},
  updates: updatesConfigured
    ? {
        url: `https://u.expo.dev/${easProjectId}`,
        enabled: true,
        checkAutomatically: 'ON_LOAD',
        fallbackToCacheTimeout: 0,
        requestHeaders: {
          'expo-channel-name': EXPO_UPDATE_CHANNEL,
        },
      }
    : {
        enabled: false,
      },
};

module.exports = {
  ...appJson,
  expo: expoConfig,
};
