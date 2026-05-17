import { useMemo, useState } from 'react';
import {
  LayoutChangeEvent,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { getAdUnitId, type AdUnitSlot } from '@rn-health/core';

export type MainTabBannerSlot = Extract<
  AdUnitSlot,
  'mainTabs.homeBanner' | 'mainTabs.historyBanner'
>;

type MainTabBannerAdProps = {
  slot: MainTabBannerSlot;
  containerStyle?: StyleProp<ViewStyle>;
};

export function MainTabBannerAd({
  slot,
  containerStyle,
}: MainTabBannerAdProps) {
  const unitId = useMemo(() => getAdUnitId(slot), [slot]);
  const [containerWidth, setContainerWidth] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    if (nextWidth > 0 && nextWidth !== containerWidth) {
      setContainerWidth(nextWidth);
    }
  };

  if (loadFailed) {
    return null;
  }

  return (
    <View
      style={[styles.bannerSlot, containerStyle]}
      onLayout={handleLayout}
    >
      {containerWidth > 0 ? (
        <BannerAd
          unitId={unitId}
          size={BannerAdSize.INLINE_ADAPTIVE_BANNER}
          width={containerWidth}
          onAdFailedToLoad={() => {
            setLoadFailed(true);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bannerSlot: {
    alignItems: 'center',
    overflow: 'hidden',
  },
});
