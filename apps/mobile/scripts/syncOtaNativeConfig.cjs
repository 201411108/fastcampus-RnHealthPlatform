/**
 * Writes expo-updates native settings from app.config.js (APP_VERSION, EAS_PROJECT_ID, …).
 * Run before release builds: yarn ota:sync-native
 */
const fs = require('fs');
const path = require('path');
const plist = require('@expo/plist').default;
const { getConfig } = require('@expo/config');
const { AndroidConfig, IOSConfig } = require('expo/config-plugins');

const projectRoot = path.join(__dirname, '..');
const appJson = require('../app.json');

function getExpoUpdatesPackageVersion() {
  const pkgPath = path.join(
    projectRoot,
    'node_modules/expo-updates/package.json',
  );
  const rootPkgPath = path.join(
    projectRoot,
    '../../node_modules/expo-updates/package.json',
  );
  const resolved = fs.existsSync(pkgPath) ? pkgPath : rootPkgPath;
  return JSON.parse(fs.readFileSync(resolved, 'utf8')).version;
}

async function syncIos(expo, expoUpdatesVersion) {
  const expoPlistPath = IOSConfig.Paths.getExpoPlistPath(projectRoot);
  fs.mkdirSync(path.dirname(expoPlistPath), { recursive: true });

  let expoPlist = {};
  if (fs.existsSync(expoPlistPath)) {
    expoPlist = plist.parse(fs.readFileSync(expoPlistPath, 'utf8'));
  }

  const updatedPlist = await IOSConfig.Updates.setUpdatesConfigAsync(
    projectRoot,
    expo,
    expoPlist,
    expoUpdatesVersion,
  );

  fs.writeFileSync(expoPlistPath, plist.build(updatedPlist));
  console.log(
    `[ota] iOS Expo.plist → ${path.relative(projectRoot, expoPlistPath)}`,
  );
}

async function syncAndroid(expo, expoUpdatesVersion) {
  const manifestPath = path.join(
    projectRoot,
    'android/app/src/main/AndroidManifest.xml',
  );
  const stringsPath = path.join(
    projectRoot,
    'android/app/src/main/res/values/strings.xml',
  );

  let manifest = await AndroidConfig.Manifest.readAndroidManifestAsync(
    manifestPath,
  );
  manifest = await AndroidConfig.Updates.setUpdatesConfigAsync(
    projectRoot,
    expo,
    manifest,
    expoUpdatesVersion,
  );
  await AndroidConfig.Manifest.writeAndroidManifestAsync(manifestPath, manifest);
  console.log(
    `[ota] Android AndroidManifest.xml → ${path.relative(projectRoot, manifestPath)}`,
  );

  const appName = appJson.displayName || 'HealthAI';
  const appVersion = expo?.version ?? '1.0.0';
  const runtimeVersionBlock = `    <string name="expo_runtime_version">${appVersion}</string>`;

  fs.writeFileSync(
    stringsPath,
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <string name="app_name">${appName}</string>\n${runtimeVersionBlock}\n</resources>\n`,
  );
  console.log(
    `[ota] Android strings.xml → ${path.relative(projectRoot, stringsPath)}`,
  );
}

async function ensurePodfileProperties() {
  const propsPath = path.join(projectRoot, 'ios/Podfile.properties.json');
  let props = {};
  if (fs.existsSync(propsPath)) {
    props = JSON.parse(fs.readFileSync(propsPath, 'utf8'));
  }
  if (!props['expo.jsEngine']) {
    props['expo.jsEngine'] = 'hermes';
    fs.writeFileSync(propsPath, `${JSON.stringify(props, null, 2)}\n`);
    console.log('[ota] iOS Podfile.properties.json (expo.jsEngine=hermes)');
  }
}

async function main() {
  const config = getConfig(projectRoot);
  const expo = config.exp;

  const expoUpdatesVersion = getExpoUpdatesPackageVersion();
  await syncIos(expo, expoUpdatesVersion);
  await syncAndroid(expo, expoUpdatesVersion);
  await ensurePodfileProperties();
  const updatesEnabled =
    expo?.updates?.enabled !== false && Boolean(expo?.updates?.url);
  console.log(
    `[ota] updates ${updatesEnabled ? 'enabled' : 'disabled'} · runtimeVersion policy appVersion · version ${expo?.version ?? 'n/a'}`,
  );
}

main().catch((error) => {
  console.error('[ota] sync failed:', error);
  process.exit(1);
});
