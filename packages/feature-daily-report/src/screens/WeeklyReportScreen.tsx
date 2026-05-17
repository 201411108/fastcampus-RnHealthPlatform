import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  getMondayOfWeek,
  shiftWeekMondayISO,
  toISODate,
} from '@rn-health/core';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {DailyReportStackParamList} from '../navigation/types';
import type {WeeklyReportDataSources, WeeklyReportDayPoint} from '../types/weeklyReport';
import {cardStyle, colors, spacing, typography} from '../theme/tokens';

const CHART_HEIGHT = 128;
const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'] as const;

type WeeklyReportScreenProps = NativeStackScreenProps<
  DailyReportStackParamList,
  'WeeklyReport'
> & {
  weeklyDataSources: WeeklyReportDataSources;
};

function isDateAfterToday(isoDate: string, todayISO: string): boolean {
  return isoDate > todayISO;
}

function formatShortDate(isoDate: string) {
  return isoDate.slice(5).replace('-', '/');
}

type BarCellProps = {
  value: number;
  maxValue: number;
  chartHeight: number;
  barColor: string;
  index: number;
  selectedIndex: SharedValue<number>;
  isFuture: boolean;
};

function BarCell({
  value,
  maxValue,
  chartHeight,
  barColor,
  index,
  selectedIndex,
  isFuture,
}: BarCellProps) {
  const norm = maxValue > 0 ? value / maxValue : 0;
  const heightProgress = useSharedValue(norm);

  useEffect(() => {
    heightProgress.value = withTiming(norm, {duration: 380});
  }, [heightProgress, norm]);

  const barStyle = useAnimatedStyle(() => {
    const h = Math.max(3, heightProgress.value * chartHeight);
    const selected = selectedIndex.value === index;
    return {
      height: h,
      opacity: isFuture ? 0.22 : selected ? 1 : 0.68,
      transform: [{scaleX: selected ? 1.08 : 1}],
    };
  });

  return (
    <View style={styles.barColumn}>
      <View style={[styles.barTrack, {height: chartHeight}]}>
        <Animated.View
          style={[styles.barFill, {backgroundColor: barColor}, barStyle]}
        />
      </View>
    </View>
  );
}

type DualChartProps = {
  title: string;
  values: number[];
  maxValue: number;
  barColor: string;
  selectedIndex: SharedValue<number>;
  weekDates: string[];
  todayISO: string;
  chartWidthSV: SharedValue<number>;
};

function DualChart({
  title,
  values,
  maxValue,
  barColor,
  selectedIndex,
  weekDates,
  todayISO,
  chartWidthSV,
}: DualChartProps) {
  const safeMax = Math.max(maxValue, 1);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(e => {
          'worklet';
          const w = chartWidthSV.value;
          if (w <= 0) {
            return;
          }
          const idx = Math.min(6, Math.max(0, Math.floor((e.x / w) * 7)));
          selectedIndex.value = idx;
        })
        .onUpdate(e => {
          'worklet';
          const w = chartWidthSV.value;
          if (w <= 0) {
            return;
          }
          const idx = Math.min(6, Math.max(0, Math.floor((e.x / w) * 7)));
          selectedIndex.value = idx;
        }),
    [chartWidthSV, selectedIndex],
  );

  const onChartLayout = (e: LayoutChangeEvent) => {
    chartWidthSV.value = e.nativeEvent.layout.width;
  };

  return (
    <View style={styles.chartBlock}>
      <Text style={styles.chartTitle}>{title}</Text>
      <GestureDetector gesture={panGesture}>
        <View style={styles.chartTouchArea} onLayout={onChartLayout}>
          <View style={styles.barsRow}>
            {values.map((v, index) => (
              <BarCell
                key={weekDates[index] ?? String(index)}
                value={v}
                maxValue={safeMax}
                chartHeight={CHART_HEIGHT}
                barColor={barColor}
                index={index}
                selectedIndex={selectedIndex}
                isFuture={isDateAfterToday(weekDates[index] ?? '', todayISO)}
              />
            ))}
          </View>
          <View style={styles.dayLabelsRow}>
            {weekDates.map((date, index) => (
              <View key={date} style={styles.dayLabelCell}>
                <Text style={styles.dayLabelWeek}>{WEEKDAY_LABELS[index]}</Text>
                <Text
                  style={[
                    styles.dayLabelDate,
                    isDateAfterToday(date, todayISO) && styles.dayLabelFuture,
                  ]}
                >
                  {formatShortDate(date)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}

export function WeeklyReportScreen({
  weeklyDataSources,
}: WeeklyReportScreenProps) {
  const insets = useSafeAreaInsets();
  const todayISO = useMemo(() => toISODate(new Date()), []);
  const initialMonday = useMemo(
    () => toISODate(getMondayOfWeek(new Date())),
    [],
  );

  const [mondayISO, setMondayISO] = useState(initialMonday);
  const [points, setPoints] = useState<WeeklyReportDayPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedIndex = useSharedValue(0);
  const caloriesChartWidth = useSharedValue(0);
  const stepsChartWidth = useSharedValue(0);
  const [summaryIndex, setSummaryIndex] = useState(0);

  const syncSummaryIndex = useCallback((idx: number) => {
    setSummaryIndex(idx);
  }, []);

  useAnimatedReaction(
    () => selectedIndex.value,
    (current, previous) => {
      if (current !== previous) {
        runOnJS(syncSummaryIndex)(Math.round(current));
      }
    },
    [syncSummaryIndex],
  );

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setErrorMessage(null);

    weeklyDataSources
      .loadWeekSeries(mondayISO)
      .then(rows => {
        if (cancelled) {
          return;
        }
        setPoints(rows);
        const todayIdx = rows.findIndex(p => p.date === todayISO);
        const idx = todayIdx >= 0 ? todayIdx : 0;
        selectedIndex.value = idx;
        setSummaryIndex(idx);
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage('주간 데이터를 불러오지 못했습니다.');
          setPoints([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mondayISO, selectedIndex, todayISO, weeklyDataSources]);

  const weekDates = useMemo(() => points.map(p => p.date), [points]);
  const caloriesValues = useMemo(
    () => points.map(p => p.nutrition.calories),
    [points],
  );
  const stepValues = useMemo(
    () => points.map(p => p.stepSummary?.stepCount ?? 0),
    [points],
  );

  const maxCalories = useMemo(
    () => caloriesValues.reduce((m, v) => Math.max(m, v), 0),
    [caloriesValues],
  );
  const maxSteps = useMemo(
    () => stepValues.reduce((m, v) => Math.max(m, v), 0),
    [stepValues],
  );

  const selectedPoint = points[summaryIndex] ?? null;
  const rangeLabel =
    weekDates.length >= 7
      ? `${formatShortDate(weekDates[0]!)} ~ ${formatShortDate(weekDates[6]!)}`
      : '';

  const goPrevWeek = () => {
    setMondayISO(prev => shiftWeekMondayISO(prev, -1));
  };

  const goNextWeek = () => {
    setMondayISO(prev => shiftWeekMondayISO(prev, 1));
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {paddingBottom: spacing.xl + insets.bottom},
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.weekHeader}>
        <Pressable
          onPress={goPrevWeek}
          style={styles.weekNavHit}
          accessibilityRole="button"
          accessibilityLabel="이전 주"
        >
          <Text style={styles.weekNavText}>이전</Text>
        </Pressable>
        <Text style={styles.weekRange}>{rangeLabel}</Text>
        <Pressable
          onPress={goNextWeek}
          style={styles.weekNavHit}
          accessibilityRole="button"
          accessibilityLabel="다음 주"
        >
          <Text style={styles.weekNavText}>다음</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>주간 기록을 불러오는 중이에요</Text>
        </View>
      ) : null}

      {errorMessage && !isLoading ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      {!isLoading && !errorMessage && points.length === 7 ? (
        <>
          <DualChart
            title="일별 칼로리 (kcal)"
            values={caloriesValues}
            maxValue={maxCalories}
            barColor={colors.primary}
            selectedIndex={selectedIndex}
            weekDates={weekDates}
            todayISO={todayISO}
            chartWidthSV={caloriesChartWidth}
          />
          <DualChart
            title="일별 걸음"
            values={stepValues}
            maxValue={maxSteps}
            barColor={colors.primaryText}
            selectedIndex={selectedIndex}
            weekDates={weekDates}
            todayISO={todayISO}
            chartWidthSV={stepsChartWidth}
          />

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              {selectedPoint
                ? `${formatShortDate(selectedPoint.date)} (${WEEKDAY_LABELS[summaryIndex]}) 요약`
                : '선택한 날'}
            </Text>
            {selectedPoint ? (
              <>
                <Text style={styles.summaryLine}>
                  칼로리 {Math.round(selectedPoint.nutrition.calories).toLocaleString('ko-KR')} kcal ·
                  식단 기록 {selectedPoint.foodRecordCount}건
                </Text>
                <Text style={styles.summaryLine}>
                  단백질 {selectedPoint.nutrition.protein.toFixed(1)} g · 탄수화물{' '}
                  {selectedPoint.nutrition.carbs.toFixed(1)} g · 지방{' '}
                  {selectedPoint.nutrition.fat.toFixed(1)} g
                </Text>
                <Text style={styles.summaryLine}>
                  {selectedPoint.stepSummary
                    ? `걸음 ${selectedPoint.stepSummary.stepCount.toLocaleString('ko-KR')}보 (목표 ${selectedPoint.stepSummary.goalStepCount.toLocaleString('ko-KR')}보)`
                    : '걸음 0보 (해당 날 저장된 스텝 인사이트 없음)'}
                </Text>
              </>
            ) : null}
          </View>

          <Text style={styles.footnote}>
            막대 그래프를 손가락으로 드래그하면 요약이 바뀌어요. 걸음은 스텝 인사이트를
            생성한 날의 값만 반영돼요.
          </Text>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  weekNavHit: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 56,
    alignItems: 'center',
  },
  weekNavText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  weekRange: {
    ...typography.section,
    flex: 1,
    textAlign: 'center',
  },
  loadingBox: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    ...typography.body,
  },
  errorText: {
    ...typography.body,
    color: colors.warningText,
  },
  chartBlock: {
    ...cardStyle,
    gap: spacing.md,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
  },
  chartTouchArea: {
    gap: spacing.sm,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '72%',
    borderRadius: 6,
    minHeight: 3,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dayLabelCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  dayLabelWeek: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryText,
  },
  dayLabelDate: {
    fontSize: 11,
    color: colors.textSubtle,
  },
  dayLabelFuture: {
    opacity: 0.5,
  },
  summaryCard: {
    ...cardStyle,
    gap: spacing.sm,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  summaryLine: {
    ...typography.body,
  },
  footnote: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
