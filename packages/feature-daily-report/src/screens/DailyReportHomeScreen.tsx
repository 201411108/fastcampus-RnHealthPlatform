import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {DailyReportDataSources} from '../types/dailyReport';
import type {DailyReportStackParamList} from '../navigation/types';
import {useDailyReport} from '../hooks/useDailyReport';
import {DailyReportDataSummaryCard} from '../components/DailyReportDataSummaryCard';
import {DailyReportEmptyState} from '../components/DailyReportEmptyState';
import {DailyReportResultCard} from '../components/DailyReportResultCard';
import {DailyReportStateView} from '../components/DailyReportStateView';
import {buttonStyle, colors, spacing, typography} from '../theme/tokens';

type DailyReportHomeScreenProps = {
  dataSources: DailyReportDataSources;
  navigation: NativeStackNavigationProp<
    DailyReportStackParamList,
    'DailyReportHome'
  >;
};

export function DailyReportHomeScreen({
  dataSources,
  navigation,
}: DailyReportHomeScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    status,
    report,
    sourceState,
    errorMessage,
    isFallback,
    loadReportSources,
    generateReport,
  } = useDailyReport({dataSources});

  const isLoading = status === 'loading' || status === 'generating';
  const isGenerating = status === 'generating';

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {paddingBottom: spacing.xl + insets.bottom},
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>오늘 Daily Report</Text>
        <Text style={styles.description}>
          식단 기록과 걸음 요약을 바탕으로 하루 흐름을 정리해요.
        </Text>
      </View>

      {isLoading ? (
        <DailyReportStateView
          key={isGenerating ? 'daily-report-generating' : 'daily-report-loading'}
          title={isGenerating ? '리포트를 생성하고 있어요' : '데이터를 확인하고 있어요'}
          description={
            isGenerating
              ? '확인한 기록을 바탕으로 AI 요약을 생성하는 중입니다.'
              : '오늘 식단 기록과 걸음 요약이 있는지 확인하는 중입니다.'
          }
          isLoading
        />
      ) : null}

      {status === 'locked' ? (
        <DailyReportStateView
          title="Daily Report를 사용할 수 없어요"
          description="현재 계정에서 리포트 생성 권한을 확인할 수 없습니다."
        />
      ) : null}

      {status === 'empty' ? (
        <DailyReportEmptyState onRetry={loadReportSources} />
      ) : null}

      {status === 'error' ? (
        <DailyReportStateView
          title="리포트를 불러오지 못했어요"
          description={errorMessage}
          actionLabel="다시 시도"
          onAction={loadReportSources}
        />
      ) : null}

      {(status === 'ready' || status === 'success') && sourceState ? (
        <DailyReportDataSummaryCard
          sourceState={sourceState}
          isGenerating={isGenerating}
          onGenerate={generateReport}
          onRefresh={loadReportSources}
        />
      ) : null}

      {status === 'success' && report ? (
        <DailyReportResultCard
          report={report}
          sourceState={sourceState}
          isFallback={isFallback}
        />
      ) : null}

      <Pressable
        style={styles.weeklyNavButton}
        onPress={() => navigation.navigate('WeeklyReport')}
        accessibilityRole="button"
      >
        <Text style={styles.weeklyNavLabel}>주간 요약 (영양·걸음)</Text>
      </Pressable>

      <Pressable
        style={styles.historyButton}
        onPress={() => navigation.navigate('DailyReportHistory')}
        accessibilityRole="button"
      >
        <Text style={styles.historyButtonLabel}>히스토리 보기</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
  },
  description: {
    ...typography.body,
  },
  weeklyNavButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  weeklyNavLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  historyButton: {
    ...buttonStyle,
  },
  historyButtonLabel: {
    color: colors.inverseText,
    fontSize: 16,
    fontWeight: '700',
  },
});
