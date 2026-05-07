import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { getAdUnitId } from '@rn-health/core';
import {
  BannerAd,
  BannerAdSize,
} from 'react-native-google-mobile-ads';
import StepCounter from '../components/StepCounter';
import StepGoalInput from '../components/StepGoalInput';
import { useStepTrackingContext } from '../providers/StepTrackingProvider';
import type { PedometerHomeScreenProps } from '../navigation/types';

export default function PedometerHomeScreen(_props: PedometerHomeScreenProps) {
  const { width: windowWidth } = useWindowDimensions();
  const { setGoalStepCount } = useStepTrackingContext();

  const horizontalPadding = 24;
  const bannerWidth = Math.max(
    0,
    Math.round(windowWidth - horizontalPadding * 2),
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.bannerSection}>
          <BannerAd
            unitId={getAdUnitId('pedometer.homeBanner')}
            size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
            width={bannerWidth}
            onAdFailedToLoad={(loadError) => {
              console.warn('배너 광고를 불러오지 못했습니다.', loadError);
            }}
          />
        </View>
        <View style={styles.content}>
          <Text style={styles.heading}>현재 걸음 수</Text>
          <StepGoalInput onGoalSaved={setGoalStepCount} />
          <StepCounter />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  bannerSection: {
    alignItems: 'center',
    marginBottom: 16,
    marginHorizontal: -24,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#111827',
  },
});
