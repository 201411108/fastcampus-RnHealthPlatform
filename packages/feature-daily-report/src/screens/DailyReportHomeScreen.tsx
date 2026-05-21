import {useCallback} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {
  type CompositeNavigationProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
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
  onOpenStore?: () => void;
};

type DailyReportTabParamList = {
  Home: undefined;
  History: undefined;
  DailyReport: undefined;
  Store: undefined;
  Settings: undefined;
};

type DailyReportHomeNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<DailyReportStackParamList, 'DailyReportHome'>,
  BottomTabNavigationProp<DailyReportTabParamList>
>;

export function DailyReportHomeScreen({
  dataSources,
  navigation,
  onOpenStore,
}: DailyReportHomeScreenProps) {
  const parentNavigation = useNavigation<DailyReportHomeNavigationProp>();
  const insets = useSafeAreaInsets();
  const {
    status,
    report,
    sourceState,
    errorMessage,
    isFallback,
    isGenerationLocked,
    loadReportSources,
    generateReport,
    refreshGenerationAccess,
  } = useDailyReport({dataSources});

  useFocusEffect(
    useCallback(() => {
      refreshGenerationAccess().catch(() => {});
    }, [refreshGenerationAccess]),
  );

  const handleOpenStore = useCallback(() => {
    if (onOpenStore) {
      onOpenStore();
      return;
    }

    const tabNavigation = parentNavigation.getParent();
    if (tabNavigation?.navigate) {
      tabNavigation.navigate('Store');
    }
  }, [onOpenStore, parentNavigation]);

  const isLoading = status === 'loading' || status === 'generating';
  const isGenerating = status === 'generating';
  const showSummaryCard =
    (status === 'ready' || status === 'success') && sourceState;
  const showLockedGenerationHint =
    isGenerationLocked && (status === 'ready' || status === 'success' || status === 'empty');

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

      {showLockedGenerationHint && status === 'empty' ? (
        <View style={styles.lockedBlock}>
          <DailyReportStateView
            title="Daily Report 생성이 잠겨 있어요"
            description="이미 생성된 리포트는 히스토리에서 확인할 수 있어요. 새 리포트를 만들려면 이용권이 필요합니다."
          />
          <Pressable
            style={styles.storeCtaButton}
            onPress={handleOpenStore}
            accessibilityRole="button"
          >
            <Text style={styles.storeCtaLabel}>스토어에서 이용권 보기</Text>
          </Pressable>
        </View>
      ) : null}

      {status === 'empty' && !showLockedGenerationHint ? (
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

      {showSummaryCard ? (
        <DailyReportDataSummaryCard
          sourceState={sourceState}
          isGenerating={isGenerating}
          isGenerationLocked={isGenerationLocked}
          onGenerate={generateReport}
          onRefresh={loadReportSources}
          onOpenStore={handleOpenStore}
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
  lockedBlock: {
    gap: spacing.md,
  },
  storeCtaButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
  },
  storeCtaLabel: {
    color: colors.inverseText,
    fontSize: 16,
    fontWeight: '700',
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
