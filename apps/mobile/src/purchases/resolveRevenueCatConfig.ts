import {
  revenueCatConfig as placeholderConfig,
  type RevenueCatConfig,
} from './revenueCatConfig.example';

function loadLocalConfig(): RevenueCatConfig | null {
  try {
    const localModule = require('./revenueCatConfig') as {
      revenueCatConfig?: RevenueCatConfig;
    };
    return localModule.revenueCatConfig ?? null;
  } catch {
    return null;
  }
}

export const revenueCatConfig: RevenueCatConfig =
  loadLocalConfig() ?? placeholderConfig;

export function hasLocalRevenueCatConfig(): boolean {
  return loadLocalConfig() !== null;
}
