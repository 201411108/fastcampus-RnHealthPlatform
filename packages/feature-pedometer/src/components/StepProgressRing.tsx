import {useEffect, useRef, useState} from 'react';
import {
  Canvas,
  Group,
  Path,
  Skia,
  type SkPath,
} from '@shopify/react-native-skia';
import {StyleSheet, Text, View} from 'react-native';
import {
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {STEP_COUNT_DISPLAY_DURATION_MS} from '../constants/stepCountAnimation';

type StepProgressRingProps = {
  stepCount: number;
  goalStepCount: number | null;
};

const RING_SIZE = 200;
const RING_CENTER = RING_SIZE / 2;
const BASE_RADIUS = 74;
const OVER_RADIUS = 86;
const BASE_STROKE = 14;
const OVER_STROKE = 8;

const TRACK_COLOR = '#e5e7eb';
const BASE_PROGRESS_COLOR = '#2563eb';
const OVER_PROGRESS_COLOR = '#1d4ed8';

const timingConfig = {duration: STEP_COUNT_DISPLAY_DURATION_MS};

function createCirclePath(radius: number): SkPath {
  const path = Skia.Path.Make();
  path.addCircle(RING_CENTER, RING_CENTER, radius);
  return path;
}

export default function StepProgressRing({
  stepCount,
  goalStepCount,
}: StepProgressRingProps) {
  const baseProgressValue = useSharedValue(0);
  const overProgressValue = useSharedValue(0);
  const animatedStep = useSharedValue(stepCount);
  const [displayStepLabel, setDisplayStepLabel] = useState(String(stepCount));

  const baseRingPathRef = useRef<SkPath>(createCirclePath(BASE_RADIUS));
  const overRingPathRef = useRef<SkPath>(createCirclePath(OVER_RADIUS));

  useEffect(() => {
    animatedStep.value = withTiming(stepCount, timingConfig);
  }, [animatedStep, stepCount]);

  useAnimatedReaction(
    () => Math.round(animatedStep.value),
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setDisplayStepLabel)(String(current));
      }
    },
  );

  useEffect(() => {
    if (!goalStepCount || goalStepCount <= 0) {
      baseProgressValue.value = withTiming(0, timingConfig);
      overProgressValue.value = withTiming(0, timingConfig);
      return;
    }

    const rawProgress = stepCount / goalStepCount;
    const nextBaseProgress = Math.min(rawProgress, 1);
    const nextOverProgress = Math.min(Math.max(rawProgress - 1, 0), 1);

    baseProgressValue.value = withTiming(nextBaseProgress, timingConfig);
    overProgressValue.value = withTiming(nextOverProgress, timingConfig);
  }, [baseProgressValue, goalStepCount, overProgressValue, stepCount]);

  return (
    <View style={styles.ringWrapper}>
      <Canvas style={styles.ringCanvas}>
        <Group
          origin={{x: RING_CENTER, y: RING_CENTER}}
          transform={[{rotate: -Math.PI / 2}]}
        >
          <Path
            path={baseRingPathRef.current}
            color={TRACK_COLOR}
            style="stroke"
            strokeWidth={BASE_STROKE}
            strokeCap="round"
          />
          <Path
            path={baseRingPathRef.current}
            color={BASE_PROGRESS_COLOR}
            style="stroke"
            strokeWidth={BASE_STROKE}
            strokeCap="round"
            start={0}
            end={baseProgressValue}
          />
          <Path
            path={overRingPathRef.current}
            color={TRACK_COLOR}
            style="stroke"
            strokeWidth={OVER_STROKE}
            strokeCap="round"
          />
          <Path
            path={overRingPathRef.current}
            color={OVER_PROGRESS_COLOR}
            style="stroke"
            strokeWidth={OVER_STROKE}
            strokeCap="round"
            start={0}
            end={overProgressValue}
          />
        </Group>
      </Canvas>
      <View style={styles.centerLabel} accessibilityElementsHidden>
        <Text style={styles.stepCount} importantForAccessibility="no">
          {displayStepLabel}보
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCanvas: {
    width: RING_SIZE,
    height: RING_SIZE,
  },
  centerLabel: {
    ...StyleSheet.absoluteFillObject,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827',
  },
});
