import {useCallback, useEffect, useRef, useState} from 'react';
import * as Haptics from 'expo-haptics';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  interpolateColor,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  STEP_COUNT_DISPLAY_DURATION_MS,
  StepProgressRing,
  useStepTrackingContext,
} from '@rn-health/feature-pedometer';

const appColors = {
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceMuted: '#ecfdf5',
  primary: '#047857',
  primarySoft: '#d1fae5',
  text: '#111827',
  textMuted: '#4b5563',
  textSubtle: '#6b7280',
  border: '#e5e7eb',
  danger: '#dc2626',
  inverseText: '#ffffff',
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

export function HomePedometerCard() {
  const [goalInput, setGoalInput] = useState('');
  const [goalSavedFlash, setGoalSavedFlash] = useState(false);
  const [lastSavedGoal, setLastSavedGoal] = useState<number | null>(null);
  const saveFlashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveButtonScale = useSharedValue(1);
  const {
    goalStepCount,
    stepCount,
    statusMessage,
    errorMessage,
    isTracking,
    isProcessing,
    isGeneratingStepInsight,
    stepInsightResult,
    setGoalStepCount,
    handleTrackingButtonPress,
  } = useStepTrackingContext();

  const animatedStep = useSharedValue(stepCount);
  const [displayStepText, setDisplayStepText] = useState(String(stepCount));
  const trackingProgress = useSharedValue(isTracking ? 1 : 0);

  useEffect(() => {
    animatedStep.value = withTiming(stepCount, {
      duration: STEP_COUNT_DISPLAY_DURATION_MS,
    });
  }, [animatedStep, stepCount]);

  useAnimatedReaction(
    () => Math.round(animatedStep.value),
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setDisplayStepText)(String(current));
      }
    },
  );

  useEffect(() => {
    trackingProgress.value = withTiming(isTracking ? 1 : 0, {duration: 220});
  }, [isTracking, trackingProgress]);

  const statusPillStyle = useAnimatedStyle(() => {
    const bg = interpolateColor(
      trackingProgress.value,
      [0, 1],
      ['#eef2f7', appColors.primarySoft],
    );
    const border = interpolateColor(
      trackingProgress.value,
      [0, 1],
      ['#e2e8f0', appColors.primarySoft],
    );
    return {backgroundColor: bg, borderColor: border};
  });

  const statusPillLabelStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      trackingProgress.value,
      [0, 1],
      ['#64748b', appColors.primary],
    );
    return {color};
  });

  const handleSaveGoal = useCallback(() => {
    const nextGoalStepCount = Number(goalInput.replace(/[^0-9]/g, ''));
    if (!Number.isFinite(nextGoalStepCount) || nextGoalStepCount <= 0) {
      Alert.alert('목표 걸음수', '1 이상의 숫자로 목표 걸음수를 입력해 주세요.');
      return;
    }

    setGoalStepCount(nextGoalStepCount);
    setGoalInput(String(nextGoalStepCount));
    setLastSavedGoal(nextGoalStepCount);
    Keyboard.dismiss();

    saveButtonScale.value = withSequence(
      withTiming(1.08, {duration: 140}),
      withTiming(1, {duration: 200}),
    );

    if (saveFlashTimeoutRef.current) {
      clearTimeout(saveFlashTimeoutRef.current);
    }
    setGoalSavedFlash(true);
    saveFlashTimeoutRef.current = setTimeout(() => {
      setGoalSavedFlash(false);
      saveFlashTimeoutRef.current = null;
    }, 1600);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );

    const message = `목표 걸음수 ${nextGoalStepCount.toLocaleString('ko-KR')}보로 저장했어요.`;
    AccessibilityInfo.announceForAccessibility(message);
  }, [goalInput, saveButtonScale, setGoalStepCount]);

  const saveButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: saveButtonScale.value}],
  }));

  useEffect(() => {
    return () => {
      if (saveFlashTimeoutRef.current) {
        clearTimeout(saveFlashTimeoutRef.current);
      }
    };
  }, []);

  const handlePressTracking = useCallback(() => {
    handleTrackingButtonPress().catch(() => {});
  }, [handleTrackingButtonPress]);

  return (
    <View style={styles.card}>
      <View style={styles.metricRow}>
        <View
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={`현재 걸음 수 ${stepCount}보, 걸음 추적 ${isTracking ? '중' : '대기'}`}
        >
          <Text style={styles.metricLabel}>현재 걸음 수</Text>
          <Text style={styles.metricValue} importantForAccessibility="no">
            {displayStepText}보
          </Text>
        </View>
        <Animated.View
          style={[styles.statusPill, statusPillStyle]}
          accessibilityElementsHidden={true}
          importantForAccessibility="no"
        >
          <Animated.Text style={[styles.statusPillLabelBase, statusPillLabelStyle]}>
            {isTracking ? '추적 중' : '대기'}
          </Animated.Text>
        </Animated.View>
      </View>

      <View style={styles.ringSection}>
        <StepProgressRing
          stepCount={stepCount}
          goalStepCount={goalStepCount}
        />
      </View>

      <Text style={styles.helperText}>{statusMessage}</Text>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      <View style={styles.goalRow}>
        <TextInput
          value={goalInput}
          onChangeText={setGoalInput}
          placeholder={
            goalStepCount ? `${goalStepCount}보` : '목표 걸음수 입력'
          }
          keyboardType="number-pad"
          style={styles.goalInput}
          accessibilityLabel="목표 걸음수 입력"
        />
        <Animated.View style={saveButtonAnimatedStyle}>
          <Pressable
            onPress={handleSaveGoal}
            style={({pressed}) => [
              styles.secondaryButton,
              goalSavedFlash ? styles.secondaryButtonSaved : null,
              pressed && styles.secondaryButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{busy: goalSavedFlash}}
            accessibilityLabel={
              goalSavedFlash ? '목표 걸음수가 저장되었습니다' : '목표 걸음수 저장'
            }
          >
            <Text
              style={[
                styles.secondaryButtonLabel,
                goalSavedFlash ? styles.secondaryButtonLabelSaved : null,
              ]}
            >
              {goalSavedFlash ? '저장됨' : '저장'}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
      {goalSavedFlash && lastSavedGoal != null ? (
        <Text
          style={styles.saveConfirmHint}
          accessibilityLiveRegion="polite"
          accessibilityRole="text"
        >
          목표 {lastSavedGoal.toLocaleString('ko-KR')}보로 적용되었어요.
        </Text>
      ) : null}
      <Pressable
        onPress={handlePressTracking}
        disabled={isProcessing}
        style={[
          styles.primaryButton,
          isProcessing && styles.disabledButton,
        ]}
        accessibilityRole="button"
      >
        <Text style={styles.primaryButtonLabel}>
          {isTracking ? '추적 중지' : '걸음 추적 시작'}
        </Text>
      </Pressable>

      {isGeneratingStepInsight ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(160)}
          style={styles.inlineLoading}
        >
          <ActivityIndicator size="small" color={appColors.primary} />
          <Text style={styles.helperText}>
            만보기 리포트를 생성하고 있어요.
          </Text>
        </Animated.View>
      ) : null}

      {stepInsightResult.summary ? (
        <Animated.View
          entering={FadeIn.duration(240)}
          exiting={FadeOut.duration(160)}
          style={styles.insightBox}
        >
          <Text style={styles.insightTitle}>최근 만보기 리포트</Text>
          <Text style={styles.helperText}>{stepInsightResult.summary}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    padding: spacing.lg,
    gap: spacing.md,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  metricLabel: {
    fontSize: 13,
    color: appColors.textSubtle,
  },
  metricValue: {
    marginTop: spacing.xs,
    fontSize: 28,
    fontWeight: '800',
    color: appColors.text,
  },
  ringSection: {
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: appColors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statusPillLabelBase: {
    fontSize: 13,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 15,
    lineHeight: 22,
    color: appColors.textMuted,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    color: appColors.danger,
  },
  goalRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  goalInput: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: appColors.text,
  },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: appColors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  primaryButtonLabel: {
    color: appColors.inverseText,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonSaved: {
    borderColor: appColors.primary,
    backgroundColor: appColors.primarySoft,
  },
  secondaryButtonPressed: {
    opacity: 0.88,
  },
  secondaryButtonLabel: {
    color: appColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButtonLabelSaved: {
    color: appColors.primary,
  },
  saveConfirmHint: {
    fontSize: 14,
    fontWeight: '600',
    color: appColors.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  insightBox: {
    borderRadius: 12,
    backgroundColor: appColors.surfaceMuted,
    padding: spacing.md,
    gap: spacing.xs,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: appColors.primary,
  },
});
