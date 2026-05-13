import {FlatList, StyleSheet, Text, View} from 'react-native';
import type {DailyReportHistoryItem} from '../types/dailyReport';
import {cardStyle, colors, spacing, typography} from '../theme/tokens';

type DailyReportHistoryListProps = {
  history: DailyReportHistoryItem[];
};

export function DailyReportHistoryList({history}: DailyReportHistoryListProps) {
  return (
    <FlatList
      data={history}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.content}
      ListEmptyComponent={
        <Text style={styles.emptyText}>저장된 Daily Report가 아직 없어요.</Text>
      }
      renderItem={({item}) => (
        <View style={styles.card}>
          <Text style={styles.date}>{item.report.date}</Text>
          <Text style={styles.summary}>{item.report.summary}</Text>
          <Text style={styles.caption}>
            {item.report.insights.length}개의 인사이트가 저장되어 있어요.
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
  card: {
    ...cardStyle,
    gap: spacing.sm,
  },
  date: {
    ...typography.caption,
  },
  summary: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.text,
  },
  caption: {
    ...typography.caption,
    color: colors.primary,
  },
});
