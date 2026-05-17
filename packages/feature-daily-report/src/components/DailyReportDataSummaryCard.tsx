import {Pressable, StyleSheet, Text, View} from 'react-native';
import Animated, {FadeIn} from 'react-native-reanimated';
import type {DailyReportSourceState} from '../types/dailyReport';
import {buttonStyle, cardStyle, colors, spacing, typography} from '../theme/tokens';

type DailyReportDataSummaryCardProps = {
  sourceState: DailyReportSourceState;
  isGenerating: boolean;
  onGenerate: () => void;
  onRefresh: () => void;
};

function formatNumber(value: number) {
  return Math.round(value).toLocaleString('ko-KR');
}

const SUMMARY_CARD_ENTERING = FadeIn.duration(240);

export function DailyReportDataSummaryCard({
  sourceState,
  isGenerating,
  onGenerate,
  onRefresh,
}: DailyReportDataSummaryCardProps) {
  return (
    <Animated.View style={styles.card} entering={SUMMARY_CARD_ENTERING}>
      <View style={styles.header}>
        <Text style={styles.title}>리포트 생성 전 데이터 확인</Text>
        <Text style={styles.description}>
          아래 기록을 기준으로 Daily Report를 생성합니다.
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>식단 기록</Text>
        <Text style={styles.value}>{sourceState.foodRecordCount}건</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>걸음 요약</Text>
        <Text style={styles.value}>
          {formatNumber(sourceState.stepCount)}보 / 목표{' '}
          {formatNumber(sourceState.goalStepCount)}보
        </Text>
      </View>
      <Text style={styles.caption}>
        목표 대비 {sourceState.progressPercent.toFixed(1)}% 기준입니다.
      </Text>

      {sourceState.isPartial ? (
        <View style={styles.noticeBadge}>
          <Text style={styles.noticeText}>
            일부 데이터만 있어도 리포트를 생성할 수 있어요.
          </Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.generateButton, isGenerating ? styles.disabledButton : null]}
        onPress={onGenerate}
        disabled={isGenerating}
        accessibilityRole="button"
      >
        <Text style={styles.generateButtonLabel}>
          {isGenerating ? '리포트 생성 중' : 'Daily Report 생성'}
        </Text>
      </Pressable>
      <Pressable
        style={styles.refreshButton}
        onPress={onRefresh}
        disabled={isGenerating}
        accessibilityRole="button"
      >
        <Text style={styles.refreshButtonLabel}>데이터 다시 확인</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardStyle,
    gap: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    ...typography.section,
  },
  description: {
    ...typography.body,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  label: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primaryText,
  },
  value: {
    ...typography.body,
    flex: 1,
    textAlign: 'right',
  },
  caption: {
    ...typography.caption,
    textAlign: 'right',
  },
  noticeBadge: {
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  noticeText: {
    ...typography.caption,
    color: colors.primary,
  },
  generateButton: {
    ...buttonStyle,
    marginTop: spacing.xs,
  },
  disabledButton: {
    opacity: 0.6,
  },
  generateButtonLabel: {
    color: colors.inverseText,
    fontSize: 16,
    fontWeight: '700',
  },
  refreshButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
});
