import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {DailyReportHistoryList} from '../components/DailyReportHistoryList';
import {useDailyReportHistory} from '../hooks/useDailyReportHistory';
import {colors, spacing, typography} from '../theme/tokens';

export function DailyReportHistoryScreen() {
  const {history, isLoading} = useDailyReportHistory();

  if (isLoading && history.length === 0) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>히스토리를 불러오는 중입니다.</Text>
      </View>
    );
  }

  return <DailyReportHistoryList history={history} />;
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
  },
});
