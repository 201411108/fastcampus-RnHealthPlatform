---
name: Reanimated 후속 (데일리 리포트·RNGH)
overview: 홈 만보기 Reanimated·키보드 작업 이후 이어서 할 수 있는 범위를 한정합니다. 다른 스레드에서 그대로 붙여 넣어 Agent/Plan 모드에 넘기기 좋도록 구성했습니다.
todos:
  - id: verify-native-builds
    content: iOS pod install 후 빌드, Android 재빌드로 react-native-keyboard-controller 네이티브 링크 검증
    status: pending
  - id: daily-report-reanimated
    content: DailyReportHomeScreen 결과 카드·로딩 전환에 Reanimated entering 적용 (패키지에 peer로 reanimated 선언 검토)
    status: pending
  - id: rngh-eval
    content: 제스처가 필요한 화면이 확정되면 react-native-gesture-handler 추가·index 진입점·GestureHandlerRootView 검토
    status: pending
  - id: history-flatlist-motion
    content: 홈 검증 후 History FlatList·세그먼트 보조 모션(선택, 스크롤 충돌 주의)
    status: pending
isProject: true
---

# 후속 작업 플랜 (RnHealthPlatform)

## 완료된 작업 (요약)

- **홈 만보기** [`apps/mobile/src/components/HomePedometerCard.tsx`](apps/mobile/src/components/HomePedometerCard.tsx): Reanimated(숫자·필·fade), `StepProgressRing`, 저장 시 햅틱·스케일·문구
- **키보드**: [`react-native-keyboard-controller`](apps/mobile/package.json) — 루트 [`KeyboardProvider`](apps/mobile/App.tsx), 홈 [`KeyboardAwareScrollView`](apps/mobile/App.tsx)
- **동기화**: [`STEP_COUNT_DISPLAY_DURATION_MS`](packages/feature-pedometer/src/constants/stepCountAnimation.ts)로 카드 숫자·링·중앙 라벨 duration 통일
- **패키지 export**: [`StepProgressRing`](packages/feature-pedometer/src/index.ts), 상수 export

## 위험·주의 (리그레션 체크 포인트)

| 항목 | 설명 |
|------|------|
| 네이티브 모듈 | `react-native-keyboard-controller` 추가 후 **iOS `pod install`**, Android **클린 빌드** 필요. CI에서 캐시된 pod/gradle만 쓰면 링크 실패 가능 |
| 키보드 + 탭바 | `KeyboardAwareScrollView`의 `bottomOffset`과 기존 `paddingBottom`(탭 높이) 조합이 기기별로 달라 보이면 `bottomOffset` / `extraKeyboardSpace` 미세 조정 |
| 접근성 | 저장 시 `announceForAccessibility` + `accessibilityLiveRegion` 중복 안내 가능성 — 실제 VoiceOver/TalkBack으로 1회 확인 권장 |
| 시뮬레이터 | 햅틱은 시뮬레이터에서 무음일 수 있음 — 동작 오류로 오인하지 말 것 |
| RNGH 미도입 | 제스처 라이브러리 없음 — 스크롤/Pressable과의 충돌은 아직 없음 |

## 권장 다음 작업 (우선순위)

1. **네이티브 빌드 스모크**: 위 표의 키보드·만보기 저장·추적 플로우를 실제 기기에서 확인 (플랜 체크리스트 todo `verify-native-builds`).
2. **Daily Report**: [`packages/feature-daily-report`](packages/feature-daily-report)의 [`DailyReportResultCard`](packages/feature-daily-report/src/components/DailyReportResultCard.tsx)·로딩 블록에 등장 애니메이션 — 패키지에 `react-native-reanimated` peer 의존성 명시 여부 검토.
3. **RNGH**: 스와이프/팬 요구가 생기면 루트 `GestureHandlerRootView`·`index` import 순서·[키보드 컨트롤러 문서](https://kirillzyusko.github.io/react-native-keyboard-controller/)와의 호환 확인 후 추가.
4. **히스토리 탭**: [`HistoryScreen`](apps/mobile/App.tsx) 세그먼트·리스트 — 홈 UX 안정화 뒤에 확장.

## 레퍼런스 파일

- 홈 만보기 카드: [`apps/mobile/src/components/HomePedometerCard.tsx`](apps/mobile/src/components/HomePedometerCard.tsx)
- 앱 셸·키보드: [`apps/mobile/App.tsx`](apps/mobile/App.tsx)
- 걸음 링·애니메이션 상수: [`packages/feature-pedometer/src/components/StepProgressRing.tsx`](packages/feature-pedometer/src/components/StepProgressRing.tsx), [`stepCountAnimation.ts`](packages/feature-pedometer/src/constants/stepCountAnimation.ts)
