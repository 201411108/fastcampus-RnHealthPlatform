# RnHealthPlatform

걸음 추적, 음식 사진 AI 분석, 데일리/위클리 건강 리포트를 하나의 모바일 앱에서 제공하는 React Native 모노레포입니다.  
기존 AI 음식 카메라와 만보기 기능을 workspace 패키지로 분리하고, 모바일 앱에서 하단 탭 기반의 건강 대시보드로 통합합니다.

## 주요 기능

- 음식 사진 촬영 및 Firebase AI 기반 영양 분석
- 분석 기록 저장/조회/삭제
- 걸음 수 추적 및 목표 대비 진행률 표시
- 걸음 데이터 기반 AI 인사이트 생성
- 일별 건강 리포트 생성 및 히스토리 관리
- 주간 음식/걸음 데이터 요약
- AdMob 배너/전면 광고 슬롯 관리
- TestFlight 및 Play internal testing 배포 워크플로

## 기술 스택

- React Native 0.81.5
- React 19
- TypeScript
- Yarn Workspaces
- React Navigation
- React Native Reanimated
- React Native Gesture Handler
- React Native Skia
- Expo Sensors / Expo Haptics
- React Native Firebase
  - App
  - AI
  - Storage
- React Native Google Mobile Ads
- AsyncStorage
- Fastlane

## 동작 흐름

1. 홈 탭에서 오늘의 걸음 현황과 저장된 음식 분석 기록 수를 확인합니다.
2. 카메라 화면에서 음식 사진을 촬영하면 Firebase AI가 음식명과 영양 정보를 추정합니다.
3. 분석 결과는 로컬 기록으로 저장되고 히스토리 탭에서 다시 확인할 수 있습니다.
4. 만보기 패키지는 일별 걸음 스냅샷과 목표 달성률을 관리합니다.
5. 데일리 리포트 탭은 음식 기록과 걸음 데이터를 조합해 건강 리포트를 생성합니다.
6. 릴리스가 published되면 GitHub Actions와 Fastlane을 통해 iOS/Android 테스트 배포를 실행합니다.

## 프로젝트 구조

```text
.
├── apps/
│   └── mobile/                  # React Native 모바일 앱
├── packages/
│   ├── core/                    # 공통 타입, 유틸, 광고 설정
│   ├── feature-ai-camera/       # 음식 카메라 분석 기능
│   ├── feature-daily-report/    # 일간/주간 건강 리포트 기능
│   └── feature-pedometer/       # 걸음 추적 및 인사이트 기능
├── .github/workflows/           # 모바일 릴리스 워크플로
└── tsconfig.base.json           # workspace 공통 TypeScript 설정
```

## 요구 사항

- Node.js 20 이상
- Yarn 4
- Xcode / CocoaPods
- Android Studio
- iOS Simulator 또는 Android Emulator / 실제 기기
- Fastlane 실행용 Ruby 환경

## 설치 및 실행

### 1. 의존성 설치

```sh
yarn install
```

### 2. iOS Pod 설치

```sh
cd apps/mobile
bundle install
bundle exec pod install
```

### 3. Metro 실행

```sh
yarn mobile:start
```

### 4. 앱 실행

Android:

```sh
yarn mobile:android
```

iOS:

```sh
yarn mobile:ios
```

## 환경 설정

### Firebase

이 프로젝트는 Firebase App, Firebase AI, Firebase Storage 설정이 필요합니다.

- Android: `apps/mobile/android/app/google-services.json`
- iOS: `apps/mobile/ios/GoogleService-Info.plist`

위 파일들은 민감 설정 파일이므로 Git에 커밋하지 않고, 로컬 환경에서 직접 추가하는 것을 전제로 합니다.

### AdMob

광고 unit id는 `apps/mobile/src/adsUnitConfig.ts`에서 관리합니다.  
개발 중에는 테스트 ID를 사용하고, 운영 배포 전에는 실제 앱 ID와 광고 unit id로 교체해야 합니다.

### 릴리스 CI/CD

모바일 릴리스 워크플로는 GitHub Release가 `published`될 때 실행됩니다.  
자세한 설정은 [apps/mobile/RELEASE_CI.md](apps/mobile/RELEASE_CI.md)를 참고합니다.

필수 secret 예시는 다음과 같습니다.

- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `APP_STORE_CONNECT_KEY_P8`
- `APPLE_TEAM_ID`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
- `ANDROID_UPLOAD_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_STORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `GOOGLE_SERVICES_JSON`

## 데이터 형식

음식 분석 결과는 아래 구조를 기준으로 저장됩니다.

```ts
interface FoodAnalysisResult {
  food_name: string;
  calories: number;
  nutrition: {
    protein: number;
    carbs: number;
    fat: number;
  };
  confidence: number;
}
```

걸음 인사이트는 아래 형태로 관리됩니다.

```ts
interface StepInsightResult {
  summary: string;
  insight: string;
  motivation: string;
}
```

## 스크립트

```sh
yarn mobile:start
yarn mobile:android
yarn mobile:ios
yarn mobile:lint
yarn mobile:typecheck
yarn lint
```

## 테스트

정적 검사:

```sh
yarn mobile:lint
yarn mobile:typecheck
```

현재 테스트 구성은 정적 검사 중심이며, Firebase AI, 네이티브 센서, 스토어 배포에 대한 통합 테스트는 포함되어 있지 않습니다.

## 구현 메모

- AI 모델은 음식 분석과 걸음 인사이트 모두 `gemini-2.5-flash`를 기준으로 사용합니다.
- 광고 ID는 core 패키지의 slot 기반 설정을 통해 앱에서 주입합니다.
- 일별 걸음 스냅샷과 리포트 히스토리는 로컬 저장소를 기준으로 관리합니다.
- `feature-*` 패키지는 모바일 앱에서 조립해 사용하는 feature module로 구성되어 있습니다.

## 주의 사항

- 음식 영양 정보와 걸음 인사이트는 AI 추정치이므로 실제 건강/의료 판단에 사용하지 않아야 합니다.
- 실제 배포 전에는 Firebase 프로젝트, 광고 unit id, 릴리스 서명, 개인정보 처리 정책, 스토어 메타데이터를 별도로 점검해야 합니다.
- `google-services.json`, `GoogleService-Info.plist`, keystore, App Store Connect API key 같은 민감 설정값은 저장소에 포함하지 않는 것을 권장합니다.
