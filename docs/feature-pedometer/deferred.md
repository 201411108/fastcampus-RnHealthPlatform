# 만보기(`@rn-health/feature-pedometer`) 보류 작업

이 문서는 **아직 이관·구현하지 않은** 항목만 정리합니다. 최근에 적용된 내용은 각 섹션에 반영했습니다.

원본 스탠드얼론 앱: 형제 디렉터리 `RnTurboPedometer` (워크스페이스 루트 기준 `../RnTurboPedometer`).

## 수익화 (IAP / 광고 제거 / RevenueCat)

다음은 **의도적 미포함**입니다.

- [ ] **IAP (`react-native-iap`)**: 광고 제거 등 비소모성 상품 — RevenueCat 도입 시 SDK·Offering/Entitlement 매핑으로 재설계 권장.
- [ ] **Purchase / Entitlement Provider**: 원본: `contexts/PurchaseEntitlementContext.tsx`, `hooks/useLocalPurchaseEntitlement.ts`, `purchaseEntitlement/types.ts`, `constants/iapProducts.ts`.

**AdMob (홈 배너 · 목표 달성 AI 인사이트 직전 전면)**  
→ `@rn-health/core`의 `getAdUnitId`, `loadAndShowInterstitialForSlot`, 앱의 `configureAdUnits` / `initializeMobileAds`로 연동 완료 (`PedometerHomeScreen`, `useStepInsightAutoTrigger`).

## Firebase AI 인사이트 · 기록

**걸음 인사이트 및 히스토리**  
→ `generateTextFromPrompt`(`@rn-health/core`) 기반 `stepInsightAi`, `stepInsightHistoryStorage`, `useStepInsightAutoTrigger`, `StepInsightResultCard`, `StepInsightHistoryList`로 복원됨.

## 알림 · FCM

- [ ] **목표 달성 로컬 알림**: 원본 `utils/goalNotification.ts` (`@notifee/react-native`).
- [ ] **FCM**: 원본 `hooks/useAppBootstrap.ts` 내 `messaging`, 토큰 `utils/fcmToken.ts`, 포그라운드에서 notifee 표시.

## 네이티브 · 백그라운드

- [ ] **Android foreground service + Notifee**: 걸음 추적 중 — 패키지 내 `services/stepForegroundService.*` 확인 후, 앱 `AndroidManifest.xml`에 `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_HEALTH`, `uses-feature`(stepcounter), `app.notifee.core.ForegroundService` 서비스 선언 필요. 원본: `RnTurboPedometer/android/app/src/main/AndroidManifest.xml`.
- [ ] **iOS**: 걸음 백그라운드 동기화용 네이티브 `StepCounter` 쿼리 — 패키지 `hooks/useStepCounterBackgroundSync.ios.ts`와 동일 전제.

## 앱 셸에서의 후속 작업

- [ ] 수익화(IAP·Entitlement) 재도입 시 `apps/mobile`에서 광고 표시 조건과 초기화 순서를 entitlement와 맞출 것.
- [ ] `useAppBootstrap` 유사 로직을 앱 한 곳에만 두고 기능 패키지는 entitlement/토큰을 props 또는 DI로 받도록 정리(선택).
