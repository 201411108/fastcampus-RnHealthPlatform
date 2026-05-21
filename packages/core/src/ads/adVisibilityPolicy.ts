let shouldHideAdsGetter: (() => boolean) | null = null;

export function setShouldHideAdsGetter(getter: () => boolean) {
  shouldHideAdsGetter = getter;
}

export function getShouldHideAds(): boolean {
  return shouldHideAdsGetter?.() ?? false;
}
