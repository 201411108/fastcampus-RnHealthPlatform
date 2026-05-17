# 모바일 릴리스 CI/CD (TestFlight · Play internal)

GitHub **Release**가 **published**될 때 [.github/workflows/mobile-release.yml](../../../.github/workflows/mobile-release.yml)이 실행된다.  
태그는 `vMAJOR.MINOR.PATCH`(예: `v1.4.0`) 형식이며, 앱 버전 `APP_VERSION`은 `v`를 뺀 값(예: `1.4.0`)이다. 빌드 번호 `BUILD_NUMBER`는 GitHub Actions의 `github.run_number`를 사용한다.

## 준비

```bash
cd apps/mobile
bundle install
```

저장소 루트에서:

```bash
yarn install
```

## 로컬 검증 명령

| 목적 | 명령 |
|------|------|
| JS lint / 타입체크 | `yarn mobile:lint` · `yarn mobile:typecheck` |
| preflight lane | `cd apps/mobile && bundle exec fastlane preflight` |
| iOS 업로드 (Mac, 인증·API 키 필요) | `cd apps/mobile && bundle exec fastlane ios upload_testflight` |
| Android Gradle만 (서명·properties 필요) | `cd apps/mobile/android && ./gradlew :app:bundleRelease -PVERSION_NAME=1.0.0 -PVERSION_CODE=42` |
| Android lane (Play JSON + keystore) | `cd apps/mobile && bundle exec fastlane android internal` |

## 환경 변수 (로컬·CI)

| 변수 | 설명 |
|------|------|
| `APP_VERSION` | 마케팅 버전 (예: `1.4.0`) |
| `BUILD_NUMBER` | iOS `CURRENT_PROJECT_VERSION` · Android `versionCode` (정수 문자열) |
| `APP_STORE_CONNECT_KEY_ID` / `APP_STORE_CONNECT_ISSUER_ID` / `APP_STORE_CONNECT_KEY_FILEPATH` | App Store Connect API |
| `TESTFLIGHT_CHANGELOG_PATH` | (선택) TestFlight “What to Test” 텍스트 파일 |
| `GOOGLE_PLAY_JSON_KEY_PATH` | Play 서비스 계정 JSON 파일 경로 |

Android 버전은 Gradle 속성 `-PVERSION_NAME` / `-PVERSION_CODE`로도 주입한다 (`android/app/build.gradle`).

## GitHub Environment / Secrets

Workflow는 `environment: mobile-release`를 사용한다. 저장소 **Settings → Environments**에서 `mobile-release`를 만들고, 필요하면 **Required reviewers**로 수동 승인을 건다.

커밋하지 말고 Secrets에만 둘 값:

| Secret | 용도 |
|--------|------|
| `APP_STORE_CONNECT_KEY_ID` | ASC API Key ID |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID |
| `APP_STORE_CONNECT_KEY_P8` | `.p8` 키 전체 (멀티라인). 워크플로가 `~/private_keys/AuthKey_<KEY_ID>.p8` 로 저장 |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Play 업로드 서비스 계정 JSON |
| `ANDROID_UPLOAD_KEYSTORE_BASE64` | 업로드 keystore 바이너리를 base64 인코딩한 값 |
| `ANDROID_KEYSTORE_STORE_PASSWORD` | keystore 비밀번호 |
| `ANDROID_KEY_ALIAS` | key alias |
| `ANDROID_KEY_PASSWORD` | key 비밀번호 |
| `GOOGLE_SERVICES_JSON` | Firebase `google-services.json` 전체 (레포에 없을 때 CI에서 `android/app/` 에 복원) |

## Secret 복원 패턴 (CI)

- **App Store Connect**: `APP_STORE_CONNECT_KEY_P8`를 파일로 쓴 뒤 `APP_STORE_CONNECT_KEY_FILEPATH`를 그 경로로 설정 (워크플로에 구현됨).
- **Play**: JSON을 `${RUNNER_TEMP}/play-service-account.json` 등에 쓰고 `GOOGLE_PLAY_JSON_KEY_PATH`를 설정 (워크플로에 구현됨).
- **Android keystore**: base64 디코드 → `apps/mobile/android/upload-keystore`, `release-keystore.properties`는 Secrets를 참조해 생성.

## 아티팩트 / 로그

- Android: 성공 시 `app-release.aab` 아티팩트.
- iOS: `ios-fastlane-logs` 아티팩트(있을 경우).
- 실패 시 해당 job 로그 하단 및 실패용 아티팩트를 확인한다.

## 실패 시 점검

| 증상 | 확인 |
|------|------|
| 태그 형식 오류 | Release 태그가 `v1.2.3` 형태인지 |
| Play `versionCode` 중복 | `BUILD_NUMBER`·offset을 이전보다 크게 |
| iOS 서명 | 팀·번들 ID, 자동 서명, Capability |
| TestFlight 401/403 | API Key·Issuer·`.p8` 일치 |
| Play 인증 | 서비스 계정 권한·패키지명 `com.hankim.healthai` |
| Keystore / `google-services` | 시크릿 복원 step 누락 여부 |

## 범위

- 업로드 대상: **TestFlight**, **Play internal testing** 만 (프로덕션·스테이징 롤아웃 없음).
- 트리거: `release: published` 만 (태그 push만으로 업로드되지 않음).

자동 생성되는 lane 목록은 [fastlane/README.md](fastlane/README.md)를 참고한다.
