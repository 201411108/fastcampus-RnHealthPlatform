# 모바일 릴리스 CI/CD (TestFlight · Play internal)

스토어 아이콘·스크린샷·해상도 체크리스트: [STORE_ASSETS.md](./STORE_ASSETS.md)

GitHub **Release**가 **published**될 때 아래 워크플로가 실행된다.

- **실행 경로 (canonical)**: 저장소 루트 [`.github/workflows/mobile-release.yml`](../../../.github/workflows/mobile-release.yml)
- **미러 사본**: [`RnHealthPlatform/.github/workflows/mobile-release.yml`](../../.github/workflows/mobile-release.yml) — 내용을 바꿀 때는 **두 파일을 항상 동일하게** 유지한다.

태그는 `vMAJOR.MINOR.PATCH`(예: `v1.4.0`) 형식이며, 앱 버전 `APP_VERSION`은 `v`를 뺀 값(예: `1.4.0`)이다. 빌드 번호 `BUILD_NUMBER`는 GitHub Actions의 `github.run_number`를 사용한다.

## 준비

```bash
cd apps/mobile
bundle install
```

`Gemfile.lock`을 바꿀 때는 CI와 동일하게 **Ruby 3.3**에서 `bundle lock` / `bundle install`을 실행하는 것을 권장한다(일부 gem은 Ruby 버전별로 설치 가능한 버전이 다름).

iOS CI는 React Native 0.81의 요구사항에 맞춰 **Xcode 16.1 이상**이 필요하므로 `macos-15` runner에서 최신 stable Xcode를 선택한다.

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
| `APPLE_TEAM_ID` | (선택) Apple Developer Team ID. 생략하면 Xcode 프로젝트의 `FCFXQT546K`를 사용 |
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
| `APP_STORE_CONNECT_KEY_P8` | `.p8` 키 전체 (멀티라인). 워크플로가 `~/private_keys/AuthKey_<KEY_ID>.p8` 로 저장. **App Manager 이상** 권한 권장 (`Developer`만이면 `cert`/`sigh` 실패 가능) |
| `APPLE_TEAM_ID` | (선택) Xcode 프로젝트와 다른 팀을 쓸 때만 설정 |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Play 업로드 서비스 계정 JSON |
| `ANDROID_UPLOAD_KEYSTORE_BASE64` | 업로드 keystore 바이너리를 base64 인코딩한 값 |
| `ANDROID_KEYSTORE_STORE_PASSWORD` | keystore 비밀번호 |
| `ANDROID_KEY_ALIAS` | key alias |
| `ANDROID_KEY_PASSWORD` | key 비밀번호 |
| `GOOGLE_SERVICES_JSON` | Firebase `google-services.json` 전체 (레포에 없을 때 CI에서 `android/app/` 에 복원) |

## Secret 복원 패턴 (CI)

- **App Store Connect**: `APP_STORE_CONNECT_KEY_P8`를 파일로 쓴 뒤 `APP_STORE_CONNECT_KEY_FILEPATH`를 그 경로로 설정한다. CI에서는 `cert` + `sigh`로 **Distribution 인증서·App Store 프로파일**을 `setup_ci` 임시 keychain에 설치한 뒤 **manual signing**으로 archive/export 한다. (`cert`에 keychain 경로를 빼면 login keychain으로 들어가 `Could not find the newly generated certificate installed`가 날 수 있음.) 생성된 `.p12`는 `fastlane/certs/`에 캐시되며, 캐시에 private key가 없는 Apple Distribution 인증서는 CI가 자동 revoke 후 새로 만든다.
- (선택) `IOS_DISTRIBUTION_CERTIFICATE_BASE64` / `IOS_DISTRIBUTION_CERTIFICATE_PASSWORD` / `IOS_PROVISIONING_PROFILE_BASE64` Secrets를 설정하면 `cert`/`sigh` 대신 해당 자료를 keychain에 import한다.
- **Play**: JSON을 `${RUNNER_TEMP}/play-service-account.json` 등에 쓰고 `GOOGLE_PLAY_JSON_KEY_PATH`를 설정 (워크플로에 구현됨).
- **Android keystore**: base64 디코드 → `apps/mobile/android/upload-keystore`, `release-keystore.properties`는 Secrets를 참조해 생성.

## 아티팩트 / 로그

- Android: 성공 시 `app-release.aab` 아티팩트.
- Android 실패: `android-gradle-failure` 아티팩트에서 `fastlane/logs/android-fastlane.log`, `android/**/build/reports`, `android/**/build/tmp`, `app/build/outputs`를 확인한다.
- iOS: 실패 여부와 관계없이 `ios-fastlane-logs` 아티팩트에서 `fastlane/logs/ios-fastlane.log`, `fastlane/logs/gym`, `HealthAI.xcresult`를 확인한다.
- 실패 원인 공유 시에는 GitHub Actions job 로그의 첫 번째 `FAILURE:` / `error:` 블록과 위 아티팩트의 플랫폼별 로그 파일을 함께 전달한다.

## iOS 실패 시 어디를 보나

`build_app`은 **archive(컴파일·서명)** 와 **export(IPA 패키징)** 를 한 lane 안에서 처리한다. `upload_to_testflight`는 그다음 단계다.

| fastlane summary | 의미 |
|------------------|------|
| `build_app`에서 `Error packaging up the application` | archive는 됐을 수 있고, **export 단계**에서 실패한 경우가 많다 |
| summary에 `upload_to_testflight` 없음 | **TestFlight 업로드까지 가지 못함** |
| `Looks like no provisioning profile mapping was provided` | fastlane 일반 안내. **원인 문장으로 쓰지 말 것** |

### 확인 순서

1. GitHub Actions → **iOS TestFlight** job → **Run fastlane (iOS)** step 로그
2. job **Artifacts** → **`ios-fastlane-logs`** 다운로드
3. 아래 파일을 연다.
   - `fastlane/logs/ios-fastlane.log` (전체 흐름)
   - `fastlane/logs/gym/HealthAI-HealthAI.log` (xcodebuild 원문)

### 로그에서 찾을 키워드

| 키워드 | 해석 |
|--------|------|
| `Archive Succeeded` / `** ARCHIVE SUCCEEDED **` | compile·archive **성공** |
| `$ xcodebuild ... -exportArchive` | **export(IPA 생성) 시작** |
| `xcodebuild: error:` | **진짜 원인** (이 줄 위아래 10~20줄을 공유) |
| `Exit status: 64` | export 인자 오류 등 (예: `-authenticationKeyPath` 중복) |
| `upload_to_testflight` | export까지 성공했을 때만 summary에 나타남 |

### 자주 나오는 export 원인

- App Store Connect API Key(`APP_STORE_CONNECT_*`) 불일치·만료·**권한 부족** (`Developer` 역할)
- `export_method: app-store`인데 CI keychain에 Distribution 인증서·App Store 프로파일 없음
- **로컬 Xcode TestFlight 업로드 성공** ≠ CI 서명 준비 완료 (Mac 키체인 vs GitHub runner)
- `Cloud signing permission error` / `No profiles for 'com.hankim.healthai'` / `No signing certificate "iOS Distribution"` → CI가 cloud signing만 시도할 때. Fastfile은 `cert` + `sigh`로 우회한다.
- `Certificate XXXXX can't be found on your local computer` → Apple Developer에만 있고 **private key(.p12)가 CI에 없는** Distribution 인증서. Fastfile이 캐시 없을 때 orphan cert를 revoke한 뒤 새로 생성한다. API Key 권한이 부족하면 [Certificates](https://developer.apple.com/account/resources/certificates/list)에서 수동 revoke.
- Xcode/fastlane export 인자 중복 (`-authenticationKeyPath may only be provided once`)

원인 공유 시 **`Archive Succeeded` 여부** + **`exportArchive` 직후 `error:` 블록**을 함께 보내면 된다.

## Android 실패 시 어디를 보나

Gradle 빌드와 Play 업로드는 `android internal` lane 안에서 순서대로 실행된다.

| fastlane summary | 의미 |
|------------------|------|
| `bundleRelease` 실패 | Gradle 빌드 단계 실패 |
| `BUILD SUCCESSFUL` 후 `upload_to_play_store` 실패 | **AAB는 만들어졌고 Play API 업로드만 실패** |
| `The caller does not have permission` | Play Console 서비스 계정 권한·JSON Secret 문제 |

### 확인 순서

1. GitHub Actions → **Android Play internal** job → **Run fastlane (Android)** step 로그
2. 실패 시 **Artifacts** → **`android-gradle-failure`**
3. **`fastlane/logs/android-fastlane.log`** 에서 첫 `FAILURE:` / `What went wrong:` / `Google Api Error:` 블록 확인

`manifest-merger-release-report.txt`는 병합 디버그 리포트라, 그 안의 `REJECTED`만으로는 실패 원인을 판단하지 않는다.

## 실패 시 점검

| 증상 | 확인 |
|------|------|
| 태그 형식 오류 | Release 태그가 `v1.2.3` 형태인지 |
| Play `versionCode` 중복 | `BUILD_NUMBER`·offset을 이전보다 크게 |
| iOS `Error packaging up the application` | `ios-fastlane-logs` → `exportArchive` 직후 `error:` |
| iOS 서명 | 팀·번들 ID, 자동 서명, Capability |
| TestFlight 401/403 | API Key·Issuer·`.p8` 일치 |
| Play `does not have permission` | Play Console Users and permissions · `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` |
| Keystore / `google-services` | 시크릿 복원 step 누락 여부 |

## 범위

- 업로드 대상: **TestFlight**, **Play internal testing** 만 (프로덕션·스테이징 롤아웃 없음).
- 트리거: `release: published` 만 (태그 push만으로 업로드되지 않음).

자동 생성되는 lane 목록은 [fastlane/README.md](fastlane/README.md)를 참고한다.
