import mobileAds from 'react-native-google-mobile-ads';

let hasInitialized = false;

export async function initializeMobileAds(): Promise<void> {
  if (hasInitialized) {
    return;
  }
  await mobileAds().initialize();
  hasInitialized = true;
}
