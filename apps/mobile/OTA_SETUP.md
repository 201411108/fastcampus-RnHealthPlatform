# Expo OTA (EAS Update) 환경설정

React Native CLI bare 앱에 `expo-updates`와 EAS Update **준비 설정**을 둔 문서입니다.  
**네이티브 스토어 릴리스**는 [RELEASE_CI.md](./RELEASE_CI.md) · `mobile-release.yml`이 담당하고, **OTA publish workflow는 포함하지 않습니다.**

## 역할 분리

| 경로 | 담당 |
|------|------|
| GitHub Release → Fastlane | 네이티브 바이너리 + 임베드 JS (`export:embed`) |
| `eas update` (수동·향후 별도 workflow) | 이미 설치된 바이너리에 JS/에셋만 배포 |

## 사전 요구

- [expo.dev](https://expo.dev) 계정
- Node 20+, Yarn 4 (저장소 루트)
- iOS: Ruby 3.3 + `bundle install` (`apps/mobile`) 후 `pod install`

## 1. EAS 프로젝트 연결 (로컬 1회)

```bash
cd apps/mobile
npx eas login
npx eas init
```

`eas init` 후 프로젝트 ID를 로컬에 저장합니다.

```bash
cp eas.project.example.json eas.project.json
# eas.project.json 의 projectId 를 대시보드/EAS init 결과 UUID 로 수정
```

또는 환경 변수만 사용:

```bash
export EAS_PROJECT_ID="<your-eas-project-uuid>"
```

`eas.project.json`은 `.gitignore`에 등록되어 있습니다.

## 2. EAS Update URL 설정

```bash
yarn ota:configure
# (= eas update:configure)
```

`app.config.js`의 `updates.url` · `extra.eas.projectId`가 채워졌는지 확인합니다.

```bash
npx expo config --type public | grep -E 'runtimeVersion|updates|projectId'
```

## 3. 네이티브 설정 동기화

`app.config.js`와 iOS `Expo.plist` / Android `AndroidManifest.xml` / `strings.xml`를 맞춥니다.

```bash
# 기본 (로컬 개발)
yarn ota:sync-native

# 릴리스 빌드와 동일하게 (Fastlane/CI와 동일)
APP_VERSION=1.4.0 EXPO_UPDATE_CHANNEL=staging yarn ota:sync-native
```

저장소 루트에서:

```bash
yarn mobile:ota:sync-native
```

**Fastlane** `upload_testflight` / `android internal` lane은 `APP_VERSION`·`EXPO_UPDATE_CHANNEL`(기본 `staging`)을 넣고 빌드 전에 자동으로 `ota:sync-native`를 실행합니다.

### iOS 추가 작업

```bash
cd ios && pod install   # EXUpdates pod (Ruby 3.3 권장)
```

## 4. runtimeVersion · 채널 정책

| 항목 | 값 |
|------|-----|
| **runtimeVersion** | `appVersion` 정책 — `APP_VERSION` / `expo.version`과 동일 |
| **staging 채널** | TestFlight · Play internal 빌드 (`EXPO_UPDATE_CHANNEL=staging`, 기본값) |
| **production 채널** | 스토어 production 바이너리 배포 후 `EXPO_UPDATE_CHANNEL=production` |

`eas.json`의 `build.*.channel`은 EAS Build 사용 시·채널 명명 참고용입니다. 현재 네이티브 빌드는 Fastlane입니다.

## 5. 검증 (production OTA publish 없음)

```bash
yarn ota:doctor          # npx expo-doctor
yarn ota:sync-native
npx expo config --type public
```

EAS 프로젝트 연결 후, **staging** 채널에만 테스트 업로드:

```bash
eas update --channel staging --message "ota-setup-verify" --non-interactive
```

동일 `runtimeVersion`을 가진 Release 바이너리에서만 업데이트가 적용됩니다.

### 수동 확인

- [ ] `Expo.plist`의 `EXUpdatesRuntimeVersion`이 `APP_VERSION`과 일치
- [ ] Android `expo_runtime_version` 문자열과 Manifest `@string/expo_runtime_version` 일치
- [ ] `EAS_PROJECT_ID` 없을 때 `EXUpdatesEnabled` / `expo.modules.updates.ENABLED` = `false` (임베드 번들만 사용)
- [ ] Debug 빌드는 Metro, Release는 OTA 또는 임베드 fallback
- [ ] `.github/workflows/mobile-release.yml`에 `eas update` job **없음**

## 6. EAS 비용 (확인 항목)

- [Expo pricing](https://expo.dev/pricing) · [Usage-based pricing](https://docs.expo.dev/billing/usage-based-pricing/)
- **EAS Update**: Free 플랜 MAU 1,000/월, edge bandwidth 100 GiB/월
- **EAS Build**: 이 프로젝트는 Fastlane으로 네이티브 빌드 → Build 크레딧 미사용
- 대시보드 Billing에서 MAU·bandwidth 알림 설정 권장

## 7. OTA 가능 vs 새 binary 필요

**OTA 가능**: React 화면/로직, 스타일, Metro 번들 에셋 (기존 네이티브 모듈만 사용)

**새 binary 필요**: RN/Expo SDK 업그레이드, 새 네이티브 모듈, 권한·Manifest/Plist, Bundle ID, 서명, AdMob/Firebase/RevenueCat 네이티브 설정 변경

## 8. 스토어 binary 배포 이후

1. production 빌드에 `EXPO_UPDATE_CHANNEL=production` bake-in
2. 별도 GitHub Environment `mobile-ota` + `EXPO_TOKEN`으로 **OTA 전용** workflow 추가 (`eas update` only)
3. 절차: 네이티브 변경 → GitHub Release → Fastlane / JS만 → `eas update --channel …`

## 관련 파일

| 파일 | 역할 |
|------|------|
| [app.config.js](./app.config.js) | `updates`, `runtimeVersion`, `projectId`, 채널 헤더 |
| [eas.json](./eas.json) | 채널 프로필 (staging / production) |
| [eas.project.example.json](./eas.project.example.json) | 로컬 projectId 예시 |
| [scripts/syncOtaNativeConfig.cjs](./scripts/syncOtaNativeConfig.cjs) | 네이티브 plist/Manifest 동기화 |
| [ios/HealthAI/Supporting/Expo.plist](./ios/HealthAI/Supporting/Expo.plist) | iOS updates 설정 |
| [fastlane/Fastfile](./fastlane/Fastfile) | 릴리스 빌드 전 `sync_ota_native_config!` |
