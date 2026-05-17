import {StyleSheet, Text, View} from 'react-native';
import Animated, {FadeInDown} from 'react-native-reanimated';
import type {DailyHealthReport} from '@rn-health/core';
import type {DailyReportSourceState} from '../types/dailyReport';
import {cardStyle, colors, radius, spacing, typography} from '../theme/tokens';

type DailyReportResultCardProps = {
  report: DailyHealthReport;
  sourceState: DailyReportSourceState | null;
  isFallback: boolean;
};

function formatNumber(value: number) {
  return Math.round(value).toLocaleString('ko-KR');
}

const RESULT_CARD_ENTERING = FadeInDown.duration(280);

export function DailyReportResultCard({
  report,
  sourceState,
  isFallback,
}: DailyReportResultCardProps) {
  return (
    <Animated.View style={styles.card} entering={RESULT_CARD_ENTERING}>
      {isFallback ? (
        <View style={styles.noticeBadge}>
          <Text style={styles.noticeText}>기본 리포트로 표시 중</Text>
        </View>
      ) : null}
      {sourceState?.isPartial ? (
        <View style={styles.partialBadge}>
          <Text style={styles.partialText}>일부 기록 기준 리포트</Text>
        </View>
      ) : null}

      <Text style={styles.date}>{report.date}</Text>
      <Text style={styles.summary}>{report.summary}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>영양 합계</Text>
        <View style={styles.metricGrid}>
          <Text style={styles.metricText}>
            칼로리 {formatNumber(report.nutrition.calories)} kcal
          </Text>
          <Text style={styles.metricText}>
            단백질 {formatNumber(report.nutrition.protein)} g
          </Text>
          <Text style={styles.metricText}>
            탄수화물 {formatNumber(report.nutrition.carbs)} g
          </Text>
          <Text style={styles.metricText}>
            지방 {formatNumber(report.nutrition.fat)} g
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>걸음 요약</Text>
        <Text style={styles.bodyText}>
          {formatNumber(report.steps.stepCount)}보 / 목표{' '}
          {formatNumber(report.steps.goalStepCount)}보
        </Text>
        <Text style={styles.captionText}>
          목표 대비 {report.steps.progressPercent.toFixed(1)}% 기준입니다.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>인사이트</Text>
        {report.insights.map(insight => (
          <Text key={insight} style={styles.insightText}>
            - {insight}
          </Text>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardStyle,
    borderRadius: radius.xl,
    borderColor: colors.primarySoft,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  noticeBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    backgroundColor: colors.warningSurface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warningText,
  },
  partialBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  partialText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  date: {
    ...typography.caption,
  },
  summary: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: colors.text,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText,
  },
  metricGrid: {
    gap: spacing.xs,
  },
  metricText: {
    ...typography.body,
  },
  bodyText: {
    ...typography.body,
  },
  captionText: {
    ...typography.caption,
  },
  insightText: {
    ...typography.body,
  },
});
