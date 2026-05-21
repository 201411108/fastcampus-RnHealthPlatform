# RevenueCat 로컬 설정

1. `revenueCatConfig.example.ts`를 복사해 `revenueCatConfig.ts`를 만듭니다.
2. RevenueCat 대시보드의 **dev** iOS/Android API 키와 패키지 identifier를 넣습니다.
3. 운영(prod) 키·실제 스토어 product id는 CI secret으로 주입하고 저장소에 커밋하지 마세요.

`revenueCatConfig.ts`가 없으면 placeholder 설정이 사용되며, 스토어 구매는 비활성화됩니다.
