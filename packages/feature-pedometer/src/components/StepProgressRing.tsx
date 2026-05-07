import {useEffect, useRef} from 'react';
import {
  Canvas,
  Group,
  Path,
  Skia,
  type SkPath,
} from '@shopify/react-native-skia';
import {StyleSheet, Text, View} from 'react-native';
import {useSharedValue, withTiming} from 'react-native-reanimated';

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

  const baseRingPathRef = useRef<SkPath>(createCirclePath(BASE_RADIUS));
  const overRingPathRef = useRef<SkPath>(createCirclePath(OVER_RADIUS));

  useEffect(() => {
    if (!goalStepCount || goalStepCount <= 0) {
      baseProgressValue.value = withTiming(0, {duration: 300});
      overProgressValue.value = withTiming(0, {duration: 300});
      return;
    }

    const rawProgress = stepCount / goalStepCount;
    const nextBaseProgress = Math.min(rawProgress, 1);
    const nextOverProgress = Math.min(Math.max(rawProgress - 1, 0), 1);

    baseProgressValue.value = withTiming(nextBaseProgress, {duration: 420});
    overProgressValue.value = withTiming(nextOverProgress, {duration: 420});
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
      <View style={styles.centerLabel}>
        <Text style={styles.stepCount}>{stepCount}보</Text>
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
