import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { StepInsightHistoryItem } from '../types/stepInsight';
import { formatStepInsightCreatedAt } from '../utils/formatStepInsightCreatedAt';

type StepInsightHistoryListProps = {
  items: StepInsightHistoryItem[];
};

export default function StepInsightHistoryList({ items }: StepInsightHistoryListProps) {
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
      ListHeaderComponent={<Text style={styles.title}>AI 인사이트 기록</Text>}
      ListEmptyComponent={
        <Text style={styles.emptyText}>생성된 AI 인사이트 기록이 없습니다.</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.historyCard}>
          <Text style={styles.metaText}>
            {formatStepInsightCreatedAt(item.createdAt)} · {item.stepCount} /{' '}
            {item.goalStepCount}보 ({item.progressPercent.toFixed(1)}%)
          </Text>
          <Text style={styles.itemTitle}>요약</Text>
          <Text style={styles.itemBody}>{item.result.summary}</Text>
          <Text style={styles.itemTitle}>인사이트</Text>
          <Text style={styles.itemBody}>{item.result.insight}</Text>
          <Text style={styles.itemTitle}>동기부여</Text>
          <Text style={styles.itemBody}>{item.result.motivation}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    gap: 8,
    paddingBottom: 24,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  emptyText: {
    marginTop: 4,
    fontSize: 14,
    color: '#4b5563',
    textAlign: 'center',
  },
  historyCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    padding: 12,
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  itemTitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
  },
  itemBody: {
    fontSize: 14,
    color: '#374151',
  },
});
